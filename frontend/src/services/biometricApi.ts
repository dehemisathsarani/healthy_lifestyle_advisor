/**
 * Biometric API Service for comprehensive health profile management
 */

const API_BASE_URL = 'http://localhost:8000';

// Types for biometric data
export interface BiometricProfile {
  id?: string;
  user_id: string;
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  fitness_goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  exercise_calories_per_day: number;
  current_bmi?: number;
  bmr?: number;
  tdee?: number;
  daily_calorie_goal?: number;
  daily_hydration_goal?: number;
  macro_goals?: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseEntry {
  id?: string;
  user_id: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  calories_burned: number;
  date: string;
  notes?: string;
}

export interface HydrationEntry {
  id?: string;
  user_id: string;
  amount_ml: number;
  beverage_type: 'water' | 'tea' | 'coffee' | 'juice' | 'sports_drink' | 'other';
  date: string;
  notes?: string;
}

export interface WeeklyProgress {
  id?: string;
  user_id: string;
  week_start_date: string;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  waist_circumference?: number;
  chest_circumference?: number;
  arm_circumference?: number;
  thigh_circumference?: number;
  notes?: string;
  progress_photos?: string[];
}

export interface HydrationSummary {
  date: string;
  total_intake: number;
  goal: number;
  percentage: number;
  entries: Array<{
    id: string;
    amount_ml: number;
    time: string;
    beverage_type: string;
  }>;
}

export interface ExerciseSummary {
  period: string;
  total_calories_burned: number;
  total_duration_minutes: number;
  total_sessions: number;
  avg_calories_per_day: number;
  exercise_breakdown: Record<string, {
    sessions: number;
    total_duration: number;
    total_calories: number;
  }>;
}

export interface ComprehensiveDashboard {
  profile: BiometricProfile;
  today_hydration: HydrationSummary;
  weekly_exercise: ExerciseSummary;
  recent_progress: WeeklyProgress[];
  health_score: number;
  dashboard_insights: string[];
}

export interface BMICalculation {
  bmi: number;
  category: string;
  description: string;
  height_cm: number;
  weight_kg: number;
}

export interface BMRCalculation {
  bmr: number;
  description: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
}

export interface TDEECalculation {
  tdee: number;
  description: string;
  bmr: number;
  activity_level: string;
  exercise_calories: number;
}

export interface HydrationGoal {
  daily_hydration_goal_ml: number;
  daily_hydration_goal_liters: number;
  weight_kg: number;
  activity_level: string;
  description: string;
}

export interface MacroGoals {
  macro_goals: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  calorie_goal: number;
  fitness_goal: string;
  body_weight_kg: number;
  description: string;
}

class BiometricAPI {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Profile Management
  async createBiometricProfile(profileData: Omit<BiometricProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ message: string; profile: BiometricProfile }> {
    const response = await fetch(`${API_BASE_URL}/biometric/profile`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  async getBiometricProfile(): Promise<{ profile: BiometricProfile }> {
    const response = await fetch(`${API_BASE_URL}/biometric/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateBiometricProfile(updateData: Partial<BiometricProfile>): Promise<{ message: string; profile: BiometricProfile }> {
    const response = await fetch(`${API_BASE_URL}/biometric/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  // Exercise Logging
  async logExercise(exerciseData: Omit<ExerciseEntry, 'id' | 'user_id'>): Promise<{ message: string; exercise: ExerciseEntry }> {
    const response = await fetch(`${API_BASE_URL}/biometric/exercise`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(exerciseData)
    });
    return this.handleResponse(response);
  }

  async getWeeklyExerciseSummary(): Promise<{ exercise_summary: ExerciseSummary }> {
    const response = await fetch(`${API_BASE_URL}/biometric/exercise/weekly`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Hydration Tracking
  async logHydration(hydrationData: Omit<HydrationEntry, 'id' | 'user_id'>): Promise<{ message: string; hydration: HydrationEntry }> {
    const response = await fetch(`${API_BASE_URL}/biometric/hydration`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(hydrationData)
    });
    return this.handleResponse(response);
  }

  async getDailyHydrationSummary(date?: string): Promise<{ hydration_summary: HydrationSummary }> {
    const params = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE_URL}/biometric/hydration/daily${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Progress Tracking
  async createWeeklyProgress(progressData: Omit<WeeklyProgress, 'id' | 'user_id'>): Promise<{ message: string; progress: WeeklyProgress }> {
    const response = await fetch(`${API_BASE_URL}/biometric/progress`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(progressData)
    });
    return this.handleResponse(response);
  }

  async getProgressHistory(weeks: number = 12): Promise<{ progress_history: { entries: WeeklyProgress[]; total_weeks: number } }> {
    const response = await fetch(`${API_BASE_URL}/biometric/progress?weeks=${weeks}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Dashboard
  async getComprehensiveDashboard(): Promise<{ dashboard: ComprehensiveDashboard }> {
    const response = await fetch(`${API_BASE_URL}/biometric/dashboard`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Calculations (no auth required)
  async calculateBMI(height: number, weight: number): Promise<BMICalculation> {
    const response = await fetch(`${API_BASE_URL}/biometric/calculations/bmi?height=${height}&weight=${weight}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async calculateBMR(weight: number, height: number, age: number, gender: string): Promise<BMRCalculation> {
    const params = new URLSearchParams({
      weight: weight.toString(),
      height: height.toString(),
      age: age.toString(),
      gender
    });
    const response = await fetch(`${API_BASE_URL}/biometric/calculations/bmr?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async calculateTDEE(bmr: number, activityLevel: string, exerciseCalories: number = 0): Promise<TDEECalculation> {
    const params = new URLSearchParams({
      bmr: bmr.toString(),
      activity_level: activityLevel,
      exercise_calories: exerciseCalories.toString()
    });
    const response = await fetch(`${API_BASE_URL}/biometric/calculations/tdee?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async calculateHydrationGoal(weight: number, activityLevel: string): Promise<HydrationGoal> {
    const params = new URLSearchParams({
      weight: weight.toString(),
      activity_level: activityLevel
    });
    const response = await fetch(`${API_BASE_URL}/biometric/calculations/hydration?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async calculateMacroGoals(calorieGoal: number, fitnessGoal: string, bodyWeight: number): Promise<MacroGoals> {
    const params = new URLSearchParams({
      calorie_goal: calorieGoal.toString(),
      fitness_goal: fitnessGoal,
      body_weight: bodyWeight.toString()
    });
    const response = await fetch(`${API_BASE_URL}/biometric/calculations/macros?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  // Utility functions for UI
  getBMICategory(bmi: number): { category: string; color: string; description: string } {
    if (bmi < 18.5) {
      return { 
        category: 'Underweight', 
        color: '#3b82f6', 
        description: 'Below normal weight' 
      };
    } else if (bmi < 25) {
      return { 
        category: 'Normal weight', 
        color: '#10b981', 
        description: 'Healthy weight range' 
      };
    } else if (bmi < 30) {
      return { 
        category: 'Overweight', 
        color: '#f59e0b', 
        description: 'Above normal weight' 
      };
    } else {
      return { 
        category: 'Obese', 
        color: '#ef4444', 
        description: 'Significantly above normal weight' 
      };
    }
  }

  getActivityLevelDescription(level: string): string {
    const descriptions = {
      'sedentary': 'Little or no exercise',
      'lightly_active': 'Light exercise/sports 1-3 days/week',
      'moderately_active': 'Moderate exercise/sports 3-5 days/week',
      'very_active': 'Hard exercise/sports 6-7 days a week',
      'extra_active': 'Very hard exercise/sports & physical job'
    };
    return descriptions[level as keyof typeof descriptions] || level;
  }

  getFitnessGoalDescription(goal: string): string {
    const descriptions = {
      'weight_loss': 'Lose weight and reduce body fat',
      'weight_gain': 'Gain weight and build mass',
      'maintenance': 'Maintain current weight',
      'muscle_gain': 'Build muscle and strength'
    };
    return descriptions[goal as keyof typeof descriptions] || goal;
  }

  getHealthScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  getHealthScoreDescription(score: number): string {
    if (score >= 80) return 'Excellent health metrics';
    if (score >= 60) return 'Good health metrics';
    if (score >= 40) return 'Fair health metrics';
    return 'Needs improvement';
  }

  // Missing methods for DataExportImport and ProgressVisualization
  async getProfile(_userId: string): Promise<BiometricProfile | null> {
    try {
      const response = await this.getBiometricProfile();
      return response.profile;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async createProfile(profileData: Omit<BiometricProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ message: string; profile: BiometricProfile }> {
    return this.createBiometricProfile(profileData);
  }

  async getExerciseHistory(_userId: string): Promise<ExerciseEntry[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/biometric/exercise/history`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<{ exercises?: ExerciseEntry[] }>(response);
      return data.exercises || [];
    } catch (error) {
      console.error('Error getting exercise history:', error);
      return [];
    }
  }

  async getHydrationHistory(_userId: string): Promise<HydrationEntry[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/biometric/hydration/history`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<{ hydration_entries?: HydrationEntry[] }>(response);
      return data.hydration_entries || [];
    } catch (error) {
      console.error('Error getting hydration history:', error);
      return [];
    }
  }

  async getWeeklyProgress(_userId: string): Promise<WeeklyProgress[]> {
    try {
      const response = await this.getProgressHistory(12);
      return response.progress_history.entries;
    } catch (error) {
      console.error('Error getting weekly progress:', error);
      return [];
    }
  }

  async recordWeeklyProgress(progressData: Omit<WeeklyProgress, 'id' | 'user_id'>): Promise<{ message: string; progress: WeeklyProgress }> {
    return this.createWeeklyProgress(progressData);
  }
}

// Export singleton instance
export const biometricApi = new BiometricAPI();
export default biometricApi;
