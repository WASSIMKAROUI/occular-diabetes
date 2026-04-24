
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "@/components/ImageUpload";
import Header from "@/components/Header";
import ResultDisplay from "@/components/ResultDisplay";

export interface PredictionResult {
  valid_retina: boolean;
  message?: string;
  diabetes?: boolean;
  confidence?: number;
  timestamp: string;
  stage?: string;
  class_probs?: { [key: string]: number };
  explanation?: string;
  previewImage?: string;
  heatmap?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handlePredictionResult = (predictionResult: PredictionResult) => {
    setResult(predictionResult);
  };

  const resetResult = () => {
    setResult(null);
  };

  if (result &&!result.valid_retina) {
  // Should never be shown because ImageUpload stops early,
  // but keep as a safeguard.
  return (
    <div className="text-center text-red-600 font-medium">
      {result.message || "Not a retinal image."}
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Retinal Image Analysis
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload a retinal image to detect potential signs of diabetes using our advanced AI model.
            </p>
          </div>
          
          {!result ? (
            <ImageUpload onPredictionResult={handlePredictionResult} />
          ) : (
            <ResultDisplay result={result} onReset={resetResult} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
