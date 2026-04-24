
# DiabetEye - Diabetes Detection from Retinal Images

A full-stack web application that uses deep learning to predict diabetes from retinal images. Built with React frontend and designed to integrate with a FastAPI/Flask backend.

## 🏥 Features

### Frontend (React + TypeScript)
- **Clean Authentication**: Secure login system with modern UI
- **Image Upload**: Drag-and-drop interface for retinal images
- **Real-time Analysis**: Loading states and progress indicators
- **Results Display**: Clear visualization of prediction results with confidence scores
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Backend Integration Ready
- **API Endpoint**: POST `/predict` route for image analysis
- **Model Placeholder**: Ready-to-use `run_model_prediction()` function
- **Authentication**: Basic username/password system
- **File Handling**: Proper image upload and processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd diabeteye
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:8080`
   - Use demo credentials: `admin` / `password`

## 🔧 Backend Integration

### FastAPI Backend (Recommended)

Create a new directory for your backend and set up the following structure:

```python
# backend/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
from PIL import Image
import io
import numpy as np

app = FastAPI()

# Enable CORS for frontend
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

def run_model_prediction(image_array: np.ndarray) -> dict:
    """
    PLACEHOLDER FUNCTION - Replace this with your trained model
    
    Args:
        image_array: Preprocessed image as numpy array
        
    Returns:
        dict: {"diabetes": bool, "confidence": float}
    """
    # TODO: Load your trained model here
    # model = load_model('path/to/your/model.h5')
    # prediction = model.predict(image_array)
    
    # Placeholder implementation
    import random
    return {
        "diabetes": random.choice([True, False]),
        "confidence": random.uniform(0.7, 0.99)
    }

@app.post("/predict")
async def predict_diabetes(
    image: UploadFile = File(...),
    username: str = Depends(authenticate_user)
):
    try:
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and preprocess image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Resize and normalize (adjust based on your model requirements)
        pil_image = pil_image.resize((224, 224))  # Example size
        image_array = np.array(pil_image) / 255.0
        
        # Run prediction
        result = run_model_prediction(image_array)
        
        return {
            "diabetes": result["diabetes"],
            "confidence": result.get("confidence", 0.0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Install Backend Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-multipart pillow numpy
```

### Run Backend

```bash
cd backend
python main.py
```

Your API will be available at `http://localhost:8000`

## 🔗 Connecting Frontend to Backend

Update the `analyzeImage` function in `src/components/ImageUpload.tsx`:

```typescript
const analyzeImage = async () => {
  if (!selectedFile) return;

  setIsAnalyzing(true);
  
  try {
    const formData = new FormData();
    formData.append('image', selectedFile);

    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Basic ' + btoa('admin:password')
      }
    });

    if (!response.ok) {
      throw new Error('Prediction failed');
    }

    const result = await response.json();
    
    const predictionResult: PredictionResult = {
      diabetes: result.diabetes,
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    };

    onPredictionResult(predictionResult);
    
    toast({
      title: "Analysis Complete",
      description: "The retinal image has been successfully analyzed.",
    });
  } catch (error) {
    toast({
      title: "Analysis Failed",
      description: "There was an error analyzing the image. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsAnalyzing(false);
  }
};
```

## 🤖 Integrating Your Model

Replace the `run_model_prediction` function with your trained model:

```python
import tensorflow as tf  # or torch for PyTorch

# Load your model (do this once at startup)
model = tf.keras.models.load_model('path/to/your/model.h5')

def run_model_prediction(image_array: np.ndarray) -> dict:
    # Preprocess according to your model's requirements
    processed_image = preprocess_image(image_array)
    
    # Make prediction
    prediction = model.predict(np.expand_dims(processed_image, axis=0))
    
    # Extract results (adjust based on your model output)
    diabetes_probability = float(prediction[0][0])
    has_diabetes = diabetes_probability > 0.5
    
    return {
        "diabetes": has_diabetes,
        "confidence": diabetes_probability if has_diabetes else (1 - diabetes_probability)
    }
```

## 🛠️ Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (recommended) or Flask
- **File Upload**: React Dropzone
- **UI Components**: Radix UI, Lucide React Icons
- **State Management**: React Hooks
- **Routing**: React Router DOM

## 📱 Demo Credentials

- **Username**: `admin`
- **Password**: `password`

## 🔒 Security Notes

- The current implementation uses basic authentication for demo purposes
- For production, implement proper JWT tokens or OAuth
- Add input validation and rate limiting
- Use HTTPS in production
- Store credentials securely (environment variables, database)

## 🎨 Customization

The app uses a medical-inspired design with:
- Blue/indigo gradient color scheme
- Clean, professional typography
- Subtle animations and transitions
- Responsive card-based layouts

You can customize the theme by modifying the Tailwind classes in the components.

## 📄 License

This project is open source and available under the MIT License.
