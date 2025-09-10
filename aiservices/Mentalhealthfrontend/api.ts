const API_BASE_URL = 'http://localhost:8001';

export const api = {
  // Mental health endpoints
  analyzeMood: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/analyze-mood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  predictStress: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/predict-stress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  getMeditationSuggestion: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/meditation/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  getBreathingExercise: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/wellness/breathing-exercise`);
    return response.json();
  },
  
  getGroundingTechnique: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/wellness/grounding-technique`);
    return response.json();
  },
  
  getGratitudePrompt: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/wellness/gratitude-prompt`);
    return response.json();
  },
  
  getWellnessRoutine: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mental-health/wellness/routine`);
    return response.json();
  }
};
