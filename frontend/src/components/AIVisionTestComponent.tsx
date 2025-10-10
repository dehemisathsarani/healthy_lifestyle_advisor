import React, { useState } from 'react'
import { foodAnalysisService } from '../services/foodAnalysisService'

interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  confidence?: number
  aiDetected?: boolean
  bbox?: [number, number, number, number]
  cookingMethod?: string
  freshnessScore?: number
}

const AIVisionTestComponent: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<FoodItem[]>([])
  const [aiVisionStatus, setAiVisionStatus] = useState<any>(null)
  const [textHint, setTextHint] = useState('')

  React.useEffect(() => {
    // Check AI Vision status on component mount
    const checkStatus = async () => {
      try {
        const status = await foodAnalysisService.getAIVisionStatus()
        setAiVisionStatus(status)
      } catch (error) {
        console.error('Failed to get AI Vision status:', error)
      }
    }
    checkStatus()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult([])
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    try {
      console.log('🔍 Starting AI Vision analysis...')
      const result = await foodAnalysisService.analyzeImage(selectedFile, textHint || undefined)
      setAnalysisResult(result)
      console.log('✅ Analysis completed:', result)
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleComparisonAnalysis = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    try {
      console.log('🔬 Starting comparison analysis...')
      const result = await foodAnalysisService.analyzeImageComparison(selectedFile, textHint || undefined)
      console.log('📊 Comparison results:', result)
      
      // Display comparison results
      alert(`
Comparison Analysis Results:
AI Vision: ${result.ai_vision.length} items detected
Traditional: ${result.traditional.length} items detected
Confidence Improvement: ${result.comparison.accuracy_improvement}
Processing Time (AI): ${result.comparison.processing_time_ai}ms
Processing Time (Traditional): ${result.comparison.processing_time_traditional}ms
      `)
      
      // Use AI vision results if available, otherwise traditional
      setAnalysisResult(result.ai_vision.length > 0 ? result.ai_vision : result.traditional)
    } catch (error) {
      console.error('❌ Comparison analysis failed:', error)
      alert('Comparison analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🤖 AI Vision Food Analysis Test
      </h2>

      {/* AI Vision Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">AI Vision Status</h3>
        {aiVisionStatus ? (
          <div className="space-y-2">
            <div className={`flex items-center space-x-2 ${aiVisionStatus.available ? 'text-green-600' : 'text-red-600'}`}>
              <span>{aiVisionStatus.available ? '✅' : '❌'}</span>
              <span>AI Vision Available: {aiVisionStatus.available ? 'Yes' : 'No'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${aiVisionStatus.yolo_loaded ? 'text-green-600' : 'text-red-600'}`}>
              <span>{aiVisionStatus.yolo_loaded ? '✅' : '❌'}</span>
              <span>YOLO Model: {aiVisionStatus.yolo_loaded ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${aiVisionStatus.tensorflow_loaded ? 'text-green-600' : 'text-red-600'}`}>
              <span>{aiVisionStatus.tensorflow_loaded ? '✅' : '❌'}</span>
              <span>TensorFlow Model: {aiVisionStatus.tensorflow_loaded ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${aiVisionStatus.opencv_loaded ? 'text-green-600' : 'text-red-600'}`}>
              <span>{aiVisionStatus.opencv_loaded ? '✅' : '❌'}</span>
              <span>OpenCV: {aiVisionStatus.opencv_loaded ? 'Available' : 'Not Available'}</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading status...</div>
        )}
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Food Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Text Hint */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Hint (Optional)
        </label>
        <input
          type="text"
          value={textHint}
          onChange={(e) => setTextHint(e.target.value)}
          placeholder="e.g., rice and curry"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Image Preview */}
      {selectedFile && (
        <div className="mb-6">
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Selected food"
            className="max-w-full max-h-64 object-contain rounded-lg shadow"
          />
        </div>
      )}

      {/* Analysis Buttons */}
      <div className="mb-6 space-x-4">
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? '🔍 Analyzing...' : '🤖 Analyze with AI Vision'}
        </button>

        <button
          onClick={handleComparisonAnalysis}
          disabled={!selectedFile || isAnalyzing}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? '🔬 Comparing...' : '🔬 Compare AI vs Traditional'}
        </button>
      </div>

      {/* Results */}
      {analysisResult.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          <div className="grid gap-4">
            {analysisResult.map((food, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{food.name}</h4>
                  {food.aiDetected && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      🤖 AI Detected
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Quantity:</span> {food.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Calories:</span> {food.calories}
                  </div>
                  <div>
                    <span className="font-medium">Protein:</span> {food.protein}g
                  </div>
                  <div>
                    <span className="font-medium">Carbs:</span> {food.carbs}g
                  </div>
                  <div>
                    <span className="font-medium">Fat:</span> {food.fat}g
                  </div>
                  {food.fiber && (
                    <div>
                      <span className="font-medium">Fiber:</span> {food.fiber}g
                    </div>
                  )}
                  {food.confidence && (
                    <div>
                      <span className="font-medium">Confidence:</span> {Math.round(food.confidence * 100)}%
                    </div>
                  )}
                  {food.freshnessScore && (
                    <div>
                      <span className="font-medium">Freshness:</span> {Math.round(food.freshnessScore * 100)}%
                    </div>
                  )}
                </div>
                {food.cookingMethod && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Cooking Method:</span> {food.cookingMethod}
                  </div>
                )}
                {food.bbox && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Bounding Box:</span> [{food.bbox.join(', ')}]
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIVisionTestComponent
