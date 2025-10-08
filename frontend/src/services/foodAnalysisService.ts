import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence?: number;
  aiDetected?: boolean;
  bbox?: [number, number, number, number];
  cookingMethod?: string;
  freshnessScore?: number;
}

interface AIVisionStatus {
  available: boolean;
  yolo_loaded: boolean;
  tensorflow_loaded: boolean;
  opencv_loaded: boolean;
}

interface ComparisonResult {
  ai_vision: FoodItem[];
  traditional: FoodItem[];
  comparison: {
    accuracy_improvement: string;
    processing_time_ai: number;
    processing_time_traditional: number;
  };
}

class FoodAnalysisService {
  async analyzeImage(file: File, textHint?: string): Promise<FoodItem[]> {
    const formData = new FormData();
    formData.append('file', file);
    if (textHint) {
      formData.append('text_hint', textHint);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/nutrition/analyze-image-ai`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  async analyzeImageComparison(file: File, textHint?: string): Promise<ComparisonResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (textHint) {
      formData.append('text_hint', textHint);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/nutrition/analyze-image-comparison`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in comparison analysis:', error);
      throw error;
    }
  }

  async getAIVisionStatus(): Promise<AIVisionStatus> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/nutrition/ai-vision-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting AI Vision status:', error);
      return {
        available: false,
        yolo_loaded: false,
        tensorflow_loaded: false,
        opencv_loaded: false,
      };
    }
  }
}

export const foodAnalysisService = new FoodAnalysisService();
export default foodAnalysisService;
