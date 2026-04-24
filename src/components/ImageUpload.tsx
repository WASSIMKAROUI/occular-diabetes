
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PredictionResult } from "@/pages/Dashboard";

interface ImageUploadProps {
  onPredictionResult: (result: PredictionResult) => void;
}

const ImageUpload = ({ onPredictionResult }: ImageUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.bmp', '.tiff']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

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
    if (!result.valid_retina) {
      toast({
        title: "Invalid image",
        description: result.message || "Please upload a valid retinal fundus photo.",
        variant: "destructive",
  });
  setIsAnalyzing(false);
  return;                 //  stop here, do NOT call onPredictionResult
}
    
    const predictionResult: PredictionResult = {
      valid_retina: true,
      diabetes: result.diabetes,
      confidence: result.confidence,
      stage: result.stage,
      timestamp: new Date().toISOString(),
      class_probs: result.class_probs,
      explanation: result.explanation,
      previewImage: preview,
      heatmap: result.heatmap
    };
    console.log("🚀 API raw result:", result);
    console.log("✅ Final PredictionResult:", predictionResult);


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

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`text-center cursor-pointer transition-all duration-200 ${
                isDragActive ? 'bg-blue-50 border-blue-400' : ''
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Retinal Image
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isDragActive
                      ? "Drop the image here..."
                      : "Drag and drop an image here, or click to select"}
                  </p>
                  <Button type="button" variant="outline" className="bg-white">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, BMP, TIFF (Max 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview!}
                  alt="Preview"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
                <Button
                  onClick={removeFile}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  File: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Analyze Image</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUpload;
