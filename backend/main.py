from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
from PIL import Image
import io
import numpy as np
import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import ResNet152_Weights
from openai import OpenAI
from dotenv import load_dotenv
import asyncio, secrets, base64, io
import os
import cv2
import matplotlib.pyplot as plt
import numpy as np



# ── load env ────────────────────────────────────────────
load_dotenv()
client = OpenAI()

# === Load ResNet152 model ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.resnet152(weights=ResNet152_Weights.DEFAULT) 

num_ftrs = model.fc.in_features 
out_ftrs = 5 
  
model.fc = nn.Sequential(    
    nn.Linear(num_ftrs, 512),
    nn.ReLU(),           # Drop 50% of neurons
    nn.Linear(512, out_ftrs),
    nn.LogSoftmax(dim=1)   
                        )

# to unfreeze more layers 
for name,child in model.named_children():
  if name in ['layer2','layer3','layer4','fc']:
    print(name + 'is unfrozen')
    for param in child.parameters():
      param.requires_grad = True
  else:
    print(name + 'is frozen')
    for param in child.parameters():
      param.requires_grad = False


# Load your trained weights
model.load_state_dict(torch.load("model_weights85.pth", map_location=device))
model = model.to(device)
model.eval()

# === FastAPI setup ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic()

def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "password")
    if not (correct_username and correct_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

async def is_retinal_image(img_bytes: bytes) -> bool:
    """Return True if GPT-4o thinks the image is a retinal fundus photo."""
    # to base64-data-url
    b64 = base64.b64encode(img_bytes).decode()
    data_url = f"data:image/jpeg;base64,{b64}"
    try:
        resp = await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4o",
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a medical assistant that must decide "
                        "whether an image is a retinal (fundus) photograph. "
                        "Reply ONLY with 'yes' or 'no'."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Is this a retinal fundus image?"},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
        )
        answer = resp.choices[0].message.content.strip().lower()
        return answer.startswith("y")
    except Exception as e:
        # If GPT fails, fail closed (treat as not retinal)
        print("GPT-4o error:", e)
        return False


def run_model_prediction(image_array: np.ndarray) -> dict:
    import cv2
    import numpy as np

    image_tensor = (
        torch.tensor(image_array, dtype=torch.float32)
        .permute(2, 0, 1)
        .unsqueeze(0)
        .to(device)
    )

    # Hooks to capture gradients and activations
    gradients = []
    activations = []

    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0])

    def forward_hook(module, input, output):
        activations.append(output)

    # Register hooks on last conv layer
    target_layer = model.layer4[-1].conv2
    forward_handle = target_layer.register_forward_hook(forward_hook)
    backward_handle = target_layer.register_backward_hook(backward_hook)

    # Forward pass
    model.zero_grad()
    output = model(image_tensor)
    probabilities = torch.softmax(output, dim=1)
    predicted_class = torch.argmax(probabilities, dim=1).item()
    confidence = probabilities[0][predicted_class].item()

    # Backward pass
    output[0, predicted_class].backward()

    # Get gradient and activation values
    grads_val = gradients[0].cpu().detach().numpy()[0]
    activation_val = activations[0].cpu().detach().numpy()[0]

    # Compute CAM
    weights = np.mean(grads_val, axis=(1, 2))
    cam = np.zeros(activation_val.shape[1:], dtype=np.float32)

    for i, w in enumerate(weights):
        cam += w * activation_val[i]

    cam = np.maximum(cam, 0)
    cam = cv2.resize(cam, (300, 300))
    cam = cam - np.min(cam)
    cam = cam / np.max(cam)

    # Generate heatmap overlay
    orig = np.uint8(255 * image_array)
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    blended = cv2.addWeighted(orig, 0.6, heatmap, 0.4, 0)

    # Save heatmap image
    heatmap_path = "heatmap_output.png"
    cv2.imwrite(heatmap_path, blended)

    # Remove hooks
    forward_handle.remove()
    backward_handle.remove()

    class_labels = ["Mild", "Moderate", "No DR", "Proliferative DR", "Severe"]
    probs = probabilities[0].tolist()

    result = {
        "diabetes": predicted_class != 2,
        "stage": class_labels[predicted_class],
        "confidence": round(confidence, 3),
        "class_probs": {label: round(probs[i], 3) for i, label in enumerate(class_labels)},
        "heatmap_path": heatmap_path
    }

    print("result: ", result)
    return result

 
async def generate_stage_description(stage: str) -> str:
    """
    Use GPT-4o to generate a detailed, clear explanation of a diabetic retinopathy stage.
    """
    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4o",
            temperature=0.5,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert medical assistant. Your task is to explain stages of diabetic retinopathy "
                        "in a clear, accurate, and patient-friendly way. Be specific about what happens to the retina "
                        "at that stage, possible symptoms, and general recommendations (like seeing an ophthalmologist). "
                        "Avoid using complex medical terms without explanation. Keep the tone calm, professional, and informative."
                    ),
                },
                {
                    "role": "user",
                    "content": f"What does the '{stage}' stage of diabetic retinopathy mean?",
                },
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("GPT-4o error:", e)
        return "We're unable to generate an explanation at this time. Please try again later."


@app.post("/predict")
async def predict_diabetes(
    image: UploadFile = File(...),
    username: str = Depends(authenticate_user)
):

    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Resize for EfficientNet-B3
        pil_image = pil_image.resize((300, 300))
        is_valid_retina = await is_retinal_image(image_data)
        if not is_valid_retina:
            return{
                "valid_retina": False,
                "message" : "Image is not a valid retinal image. please upload a valid retinal image"
                
            }
        
        image_array = np.array(pil_image) / 255.0
        result = run_model_prediction(image_array)
        explanation_text = await generate_stage_description(result["stage"])

        # === NEW: read heatmap image and convert to base64 ===
        heatmap_path = result["heatmap_path"]
        with open(heatmap_path, "rb") as f:
            heatmap_b64 = base64.b64encode(f.read()).decode()
        heatmap_data_url = f"data:image/png;base64,{heatmap_b64}"


        return {
            "valid_retina": True,
            "diabetes": result["diabetes"],
            "confidence": result["confidence"],
            "stage": result["stage"],
            "class_probs": result["class_probs"],
            "explanation": explanation_text,
            "heatmap": heatmap_data_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
