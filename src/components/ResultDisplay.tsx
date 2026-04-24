
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RotateCcw, Calendar, TrendingUp, Activity } from "lucide-react";
import { PredictionResult } from "@/pages/Dashboard";
import PDFExport from "./PDFexport";

interface ResultDisplayProps {
  result: PredictionResult;
  onReset: () => void;
}

const ResultDisplay = ({ result, onReset }: ResultDisplayProps) => {
  const isDiabetic = result.diabetes;
  const confidence = result.confidence ? Math.round(result.confidence * 100) : 85;
  const timestamp = new Date(result.timestamp).toLocaleString();
  const stage = result.stage ?? "Unknown";
  const preview = result.previewImage;



  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            {isDiabetic ? (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Analysis Complete
          </CardTitle>
          <p className="text-gray-600">
            AI-powered retinal image analysis results
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="mb-4">
              <Badge
                variant={isDiabetic ? "destructive" : "default"}
                className={`text-lg px-6 py-2 ${
                  isDiabetic 
                    ? "bg-red-100 text-red-800 hover:bg-red-200" 
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
              >
                {isDiabetic ? "Diabetic Retinopathy Detected" : "No Signs of Diabetes"}
              </Badge>
            </div>
            
              <div className="grid md:grid-cols-3 gap-6 mt-8">
              
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="font-semibold text-gray-700">Stage</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stage}</div>
                </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-gray-700">Confidence</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{confidence}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${confidence}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-gray-700">Analysis Time</span>
                </div>
                <div className="text-sm text-gray-600">{timestamp}</div>
              </div>
            </div>
          </div>

        {result.explanation && (
          <div className="bg-blue-50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
            <p className="text-blue-800 text-sm whitespace-pre-line">
              {result.explanation}
            </p>
          </div>
)}

          {result.class_probs && (
  <div className="bg-gray-50 rounded-lg p-6 mt-6">
    <h4 className="font-semibold text-gray-800 mb-4 text-center">
      Model Prediction Breakdown
    </h4>
    <div className="space-y-4">
      {Object.entries(result.class_probs).map(([label, prob]) => {
        const percentage = Math.round(prob * 100);
        return (
          <div key={label}>
            <div className="flex justify-between text-sm text-gray-700 font-medium">
              <span>{label}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
<div className="hidden">
<div id="pdf-content" className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg text-gray-800 max-w-2xl mx-auto">
  <div className="text-center mb-6">
    <div className="inline-flex items-center justify-center bg-indigo-100 w-16 h-16 rounded-full mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-3xl font-bold text-indigo-800 mb-2">Retinal Analysis Report</h2>
    <p className="text-indigo-600">Comprehensive eye health assessment</p>
  </div>

  {/* Image and Heatmap Side-by-Side */}
  <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
    {result.previewImage && (
      <div className="flex-1 p-2 bg-white rounded-xl shadow-md border border-gray-100">
        <p className="text-center font-medium text-gray-700 mb-2">Original Retinal Image</p>
        <img
          src={result.previewImage}
          alt="Retinal Image"
          className="w-full rounded-lg shadow-inner border border-gray-200"
        />
      </div>
    )}
    
    {result.heatmap && (
      <div className="flex-1 p-2 bg-white rounded-xl shadow-md border border-gray-100">
        <p className="text-center font-medium text-gray-700 mb-2">Model Attention Heatmap</p>
        <img
          src={result.heatmap}
          alt="Model Focus Areas"
          className="w-full rounded-lg shadow-inner border border-gray-200"
        />
      </div>
    )}
  </div>

  <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-blue-600 mb-1">Stage</p>
        <p className="text-xl font-semibold text-gray-800">{result.stage}</p>
      </div>
      <div className="bg-indigo-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-indigo-600 mb-1">Confidence</p>
        <p className="text-xl font-semibold text-gray-800">{Math.round((result.confidence ?? 0) * 100)}%</p>
      </div>
    </div>
    
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-sm font-medium text-gray-600 mb-1">Date of Analysis</p>
      <p className="text-lg font-medium text-gray-800">{new Date(result.timestamp).toLocaleString()}</p>
    </div>
  </div>

  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
      </svg>
      Clinical Interpretation
    </h3>
    <div className="prose prose-indigo max-w-none text-gray-600">
      <p>{result.explanation}</p>
    </div>
  </div>

  <div className="mt-6 text-center text-sm text-gray-500">
    <p>This report was generated by AI and should be reviewed by a medical professional.</p>
  </div>
</div>
</div>

<PDFExport />



          <div className="flex justify-center pt-4">
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center space-x-2 hover:bg-blue-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Analyze Another Image</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultDisplay;
