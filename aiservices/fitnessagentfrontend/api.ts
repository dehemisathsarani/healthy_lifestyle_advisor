// API client for the Fitness Agent system
import axios from 'axios';
import { 
  HealthSummary, 
  HeartRateData, 
  SleepData, 
  ActivityData, 
  RecoveryAdvice, 
  HealthAlert,
  HealthMetric
} from './healthApi';

// Goal Setting and Achievement Types
export interface FitnessGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'weight' | 'strength' | 'endurance' | 'nutrition' | 'habit' | 'custom';
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
  milestones: GoalMilestone[];
  xp_reward?: number; // XP earned for completing this goal
}

export interface GoalMilestone {
  id: string;
  title: string;
  target_value: number;
  achieved: boolean;
  achieved_date?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'workout' | 'nutrition' | 'consistency' | 'milestone' | 'special';
  icon: string;
  color: string;
  earned: boolean;
  earned_date?: string;
  progress?: number; // 0-100 for in-progress achievements
  level?: number; // For tiered achievements (bronze, silver, gold)
  xp_reward?: number; // XP earned for unlocking this achievement
}

export interface LevelReward {
  id: string;
  name: string;
  description: string;
  levelRequired: number;
  type: 'badge' | 'feature' | 'discount' | 'content';
  claimed: boolean;
  imageUrl?: string;
}

export interface XpRule {
  id: string;
  activity: string;
  description: string;
  xpAmount: number;
  category: 'workout' | 'goal' | 'health' | 'social' | 'special';
  frequency: 'once' | 'daily' | 'weekly' | 'unlimited';
  bonusMultiplier?: number; // For streak bonuses
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earned: boolean;
  earnedDate?: string;
  image: string;
  requirement: string;
}

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FITNESS_API_BASE_URL = import.meta.env.VITE_FITNESS_API_URL || 'http://localhost:8002';

// Create axios instances
const backendAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const fitnessAPI = axios.create({
  baseURL: FITNESS_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
backendAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

fitnessAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'flexibility' | 'general_fitness';
  preferred_workout_duration: number; // in minutes
  preferred_workout_days: number; // per week
  equipment_access: boolean;
  injuries: string[];
  workout_preferences: string[];
  achievements: Achievement[];
  level: number;
  experiencePoints: number;
  xpRules: XpRule[];
  levelRewards: LevelReward[];
  medals: Medal[];
  goals: FitnessGoal[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment_required: string[];
  instructions: string[];
  duration: number;
  calories_burned: number;
  video_url?: string;
  image_url?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  goal: string;
  duration_weeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  workout_sessions: WorkoutSession[];
  created_at: string;
}

export interface WorkoutSession {
  day: number;
  name: string;
  focus: string; // e.g. "Upper Body", "Lower Body", "Core", "Cardio", etc.
  exercises: WorkoutExercise[];
  total_duration: number;
  total_calories: number;
  rest_day: boolean;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: number | null; // null for time-based exercises
  duration_seconds: number | null; // null for rep-based exercises
  rest_seconds: number;
  notes?: string;
}

export interface FitnessDashboardData {
  active_plan: WorkoutPlan | null;
  upcoming_workout: WorkoutSession | null;
  workout_streak: number;
  total_workouts_completed: number;
  total_calories_burned: number;
  weekly_activity_summary: {
    date: string;
    calories_burned: number;
    minutes_active: number;
    workouts_completed: number;
  }[];
  fitness_stats: {
    current_weight: number;
    starting_weight: number;
    weight_change: number;
    workout_consistency: number; // percentage
  };
}

export interface WorkoutHistory {
  completed_workouts: {
    id: string;
    plan_name: string;
    session_name: string;
    date: string;
    duration: number;
    calories_burned: number;
    exercises_completed: number;
    rating: number | null;
    notes: string | null;
  }[];
  total_pages: number;
}

export interface WorkoutFilter {
  page: number;
  limit: number;
  start_date?: string;
  end_date?: string;
  workout_type?: string;
}

// API Client methods
class FitnessApiClient {
  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await backendAPI.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await backendAPI.put('/user/profile', profile);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Workout Plans
  async generateWorkoutPlan(preferences: {
    goal: string;
    duration_weeks: number;
    days_per_week: number;
    session_duration: number;
    equipment_access: boolean;
  }): Promise<WorkoutPlan> {
    try {
      const response = await fitnessAPI.post('/workouts/generate', preferences);
      return response.data;
    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw new Error('Failed to generate workout plan');
    }
  }

  async getWorkoutPlan(planId: string): Promise<WorkoutPlan> {
    try {
      const response = await fitnessAPI.get(`/workouts/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workout plan:', error);
      throw new Error('Failed to fetch workout plan');
    }
  }

  async getActiveWorkoutPlan(): Promise<WorkoutPlan | null> {
    try {
      const response = await fitnessAPI.get('/workouts/plans/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active workout plan:', error);
      return null;
    }
  }

  async activateWorkoutPlan(planId: string): Promise<{ success: boolean }> {
    try {
      await fitnessAPI.post(`/workouts/plans/${planId}/activate`);
      return { success: true };
    } catch (error) {
      console.error('Error activating workout plan:', error);
      throw new Error('Failed to activate workout plan');
    }
  }

  // Dashboard Data
  async getDashboardData(): Promise<FitnessDashboardData> {
    try {
      const response = await fitnessAPI.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  // Workout History
  async getWorkoutHistory(filters: WorkoutFilter): Promise<WorkoutHistory> {
    try {
      const response = await fitnessAPI.get('/workouts/history', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching workout history:', error);
      throw new Error('Failed to fetch workout history');
    }
  }

  // Complete Workout
  async completeWorkout(workoutData: {
    session_id: string;
    duration: number;
    exercises_completed: { exercise_id: string; sets_completed: number; notes?: string }[];
    rating?: number;
    notes?: string;
  }): Promise<{ success: boolean }> {
    try {
      await fitnessAPI.post('/workouts/complete', workoutData);
      return { success: true };
    } catch (error) {
      console.error('Error completing workout:', error);
      throw new Error('Failed to record completed workout');
    }
  }

  // Exercise Library
  async getExerciseLibrary(filters: {
    muscle_group?: string;
    difficulty?: string;
    equipment?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ exercises: Exercise[]; total: number; page: number; limit: number }> {
    try {
      const response = await fitnessAPI.get('/exercises', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching exercise library:', error);
      throw new Error('Failed to fetch exercise library');
    }
  }

  async getExerciseDetails(id: string): Promise<Exercise> {
    try {
      const response = await fitnessAPI.get(`/exercises/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exercise details:', error);
      throw new Error('Failed to fetch exercise details');
    }
  }

  // HTTP Methods for healthApi.ts compatibility
  async get(url: string) {
    try {
      const response = await backendAPI.get(url);
      return response;
    } catch (error) {
      console.error('Error in GET request:', error);
      throw new Error('Failed to fetch data');
    }
  }

  async post(url: string, data?: any) {
    try {
      const response = await backendAPI.post(url, data);
      return response;
    } catch (error) {
      console.error('Error in POST request:', error);
      throw new Error('Failed to submit data');
    }
  }

  async put(url: string, data?: any) {
    try {
      const response = await backendAPI.put(url, data);
      return response;
    } catch (error) {
      console.error('Error in PUT request:', error);
      throw new Error('Failed to update data');
    }
  }

  async delete(url: string) {
    try {
      const response = await backendAPI.delete(url);
      return response;
    } catch (error) {
      console.error('Error in DELETE request:', error);
      throw new Error('Failed to delete data');
    }
  }

  // Add missing method getExercises
  async getExercises(): Promise<Exercise[]> {
    try {
      const response = await backendAPI.get('/exercises');
      return response.data;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw new Error('Failed to fetch exercises');
    }
  }
}

export const apiClient = new FitnessApiClient();

// For demo mode or development
// Store demo workout plans in memory during the session
const demoWorkoutPlans: WorkoutPlan[] = [
  {
    id: 'demo-plan-1',
    name: 'Strength Building Program',
    description: 'A 6-week program focused on building overall strength',
    goal: 'strength',
    duration_weeks: 6,
    difficulty: 'intermediate',
    workout_sessions: [
      {
        day: 1,
        name: 'Upper Body Strength',
        focus: 'Chest, Back, Shoulders',
        exercises: [],
        total_duration: 60,
        total_calories: 350,
        rest_day: false
      },
      {
        day: 2,
        name: 'Rest Day',
        focus: 'Recovery',
        exercises: [],
        total_duration: 0,
        total_calories: 0,
        rest_day: true
      },
      {
        day: 3,
        name: 'Lower Body Strength',
        focus: 'Legs, Glutes',
        exercises: [],
        total_duration: 65,
        total_calories: 380,
        rest_day: false
      }
    ],
    created_at: new Date().toISOString()
  }
];

export const demoMode = {
  isDemoMode: (): boolean => {
    return import.meta.env.VITE_DEMO_MODE === 'true';
  },
  
  getDemoHealthSummary: (date?: string): HealthSummary => {
    // Generate a realistic health summary for the given date
    const selectedDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Make data slightly different for different dates
    const dateDiff = Math.abs(new Date(selectedDate).getTime() - new Date(today).getTime());
    const daysDiff = Math.floor(dateDiff / (1000 * 60 * 60 * 24));
    
    const baseSteps = 8750;
    const baseCalories = 2350;
    const baseSleep = 7.3;
    const baseHeartRate = 68;
    
    // Add some variation based on the day
    const stepsVariation = Math.sin(daysDiff * 0.5) * 2000;
    const caloriesVariation = Math.sin(daysDiff * 0.5) * 300;
    const sleepVariation = Math.sin(daysDiff * 0.7) * 1.2;
    const hrVariation = Math.sin(daysDiff * 0.3) * 8;
    
    const steps = Math.max(1000, Math.round(baseSteps + stepsVariation));
    const calories = Math.max(1800, Math.round(baseCalories + caloriesVariation));
    const sleep = Math.max(4, Math.min(9, baseSleep + sleepVariation));
    const heartRate = Math.max(55, Math.round(baseHeartRate + hrVariation));
    
    // Calculate recovery score (0-100)
    const sleepFactor = Math.min(1, sleep / 8) * 0.4;
    const hrFactor = (1 - Math.abs(heartRate - 65) / 30) * 0.3;
    const stepsFactor = Math.min(1, steps / 10000) * 0.3;
    
    const recoveryScore = Math.round((sleepFactor + hrFactor + stepsFactor) * 100);
    
    let recoveryStatus = 'needs_recovery';
    if (recoveryScore >= 80) recoveryStatus = 'optimal';
    else if (recoveryScore >= 65) recoveryStatus = 'good';
    else if (recoveryScore >= 50) recoveryStatus = 'moderate';
    
    return {
      date: selectedDate,
      steps: {
        total: steps,
        goal_progress: steps / 10000,
      },
      sleep: {
        duration_hours: sleep,
        quality_score: Math.round(sleep * 10 + Math.random() * 20),
        deep_sleep_hours: sleep * 0.25 + Math.random() * 0.5,
      },
      calories: {
        total: calories,
      },
      heart_rate: {
        average: heartRate,
        min: heartRate - Math.round(Math.random() * 10 + 5),
        max: heartRate + Math.round(Math.random() * 20 + 30),
      },
      recovery: {
        score: recoveryScore,
        status: recoveryStatus,
        factors: {
          sleep_quality: sleepFactor,
          resting_heart_rate: hrFactor, 
          activity_balance: stepsFactor,
        },
      },
    };
  },
  
  getHeartRateData: (startTime?: string, endTime?: string): HeartRateData[] => {
    const end = endTime ? new Date(endTime) : new Date();
    const start = startTime ? new Date(startTime) : new Date(end.getTime() - 24 * 60 * 60 * 1000);
    
    const data: HeartRateData[] = [];
    const interval = Math.floor((end.getTime() - start.getTime()) / 30); // 30 data points
    
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(start.getTime() + interval * i);
      
      // Create a realistic heart rate pattern
      const hourOfDay = timestamp.getHours();
      let baseBPM = 65;
      
      // Heart rate is lower at night, higher during the day
      if (hourOfDay >= 22 || hourOfDay < 6) {
        baseBPM = 55;
      } else if (hourOfDay >= 6 && hourOfDay < 9) {
        baseBPM = 70; // Morning activity
      } else if (hourOfDay >= 17 && hourOfDay < 20) {
        baseBPM = 75; // Evening activity
      }
      
      // Add some random variation
      const bpm = Math.round(baseBPM + (Math.random() * 15 - 5));
      
      // Determine activity state
      let activityState = "rest";
      if (bpm > 90) activityState = "active";
      if (bpm > 120) activityState = "exercise";
      
      data.push({
        bpm,
        timestamp: timestamp.toISOString(),
        activity_state: activityState,
        confidence: 0.95
      });
    }
    
    return data;
  },
  
  getSleepData: (startDate?: string, endDate?: string): SleepData[] => {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const data: SleepData[] = [];
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      date.setHours(23, 0, 0, 0);
      
      // Sleep start time (around 11pm)
      const startTime = new Date(date);
      startTime.setHours(23, Math.floor(Math.random() * 59), 0, 0);
      
      // Sleep duration varies between 6-8.5 hours
      const durationHours = 6 + Math.random() * 2.5;
      const durationMinutes = Math.round(durationHours * 60);
      
      // Sleep end time
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      
      // Sleep stages
      const deepSleepPercent = 15 + Math.random() * 10; // 15-25%
      const remSleepPercent = 20 + Math.random() * 10; // 20-30%
      const lightSleepPercent = 100 - deepSleepPercent - remSleepPercent - (Math.random() * 5); // Remainder minus awake time
      const awakePercent = 100 - deepSleepPercent - remSleepPercent - lightSleepPercent;
      
      const deepSleepMinutes = Math.round(durationMinutes * (deepSleepPercent / 100));
      const remSleepMinutes = Math.round(durationMinutes * (remSleepPercent / 100));
      const lightSleepMinutes = Math.round(durationMinutes * (lightSleepPercent / 100));
      const awakeMinutes = Math.round(durationMinutes * (awakePercent / 100));
      
      // Sleep score (0-100)
      const sleepScore = Math.round(
        50 + // Base score
        (durationHours - 6) * 10 + // Duration factor
        (deepSleepPercent - 15) * 1.5 + // Deep sleep factor
        (remSleepPercent - 20) * 1 - // REM sleep factor
        (awakeMinutes / 10) // Awake penalty
      );
      
      data.push({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        deep_sleep_minutes: deepSleepMinutes,
        light_sleep_minutes: lightSleepMinutes,
        rem_sleep_minutes: remSleepMinutes,
        awake_minutes: awakeMinutes,
        sleep_score: Math.min(100, Math.max(0, sleepScore)),
        interruptions: Math.floor(Math.random() * 3)
      });
    }
    
    return data;
  },
  
  getActivityData: (startDate?: string, endDate?: string): ActivityData[] => {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const data: ActivityData[] = [];
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Step count varies between 3000-12000
      const baseSteps = 8000;
      const dayOfWeek = date.getDay();
      
      // More steps on weekdays, fewer on weekends
      let stepMultiplier = 1.0;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        stepMultiplier = 0.7;
      }
      
      // Add some randomness
      const randomFactor = 0.7 + Math.random() * 0.6;
      const steps = Math.round(baseSteps * stepMultiplier * randomFactor);
      
      // Distance in meters (approx. 0.7m per step)
      const distance = Math.round(steps * 0.7);
      
      // Floors climbed (1 floor = ~10 feet = ~3 meters)
      const floors = Math.round(Math.random() * 12);
      
      data.push({
        count: steps,
        timestamp: date.toISOString(),
        distance_meters: distance,
        floors_climbed: floors,
        elevation_gain: floors * 3
      });
    }
    
    return data;
  },
  
  getRecoveryAdvice: (date?: string): RecoveryAdvice => {
    const selectedDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Generate recovery score based on date
    const dateDiff = Math.abs(new Date(selectedDate).getTime() - new Date(today).getTime());
    const daysDiff = Math.floor(dateDiff / (1000 * 60 * 60 * 24));
    
    // Generate a score that varies by day
    const baseScore = 65;
    const scoreVariation = Math.sin(daysDiff * 0.5) * 20;
    const recoveryScore = Math.round(Math.max(30, Math.min(95, baseScore + scoreVariation)));
    
    let recoveryStatus = 'needs_recovery';
    if (recoveryScore >= 80) recoveryStatus = 'optimal';
    else if (recoveryScore >= 65) recoveryStatus = 'good';
    else if (recoveryScore >= 50) recoveryStatus = 'moderate';
    
    // Create a date-based workout intensity history for the past week
    const workoutIntensityHistory: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const historyDate = new Date();
      historyDate.setDate(historyDate.getDate() - i);
      const dateStr = historyDate.toISOString().split('T')[0];
      workoutIntensityHistory[dateStr] = Math.random() * 0.8 + 0.2; // Random intensity between 0.2-1.0
    }
    
    return {
      id: `recovery-${selectedDate}`,
      user_id: 'test_user_id',
      title: `Your Recovery Status for ${selectedDate}`,
      description: `Based on your recent activity, sleep patterns, and heart rate variability, your body is showing ${recoveryStatus.replace('_', ' ')} recovery.`,
      advice_date: selectedDate,
      
      recovery_score: recoveryScore,
      recovery_status: recoveryStatus,
      factors: {
        sleep_quality: Math.random() * 0.4 + 0.3,
        resting_heart_rate: Math.random() * 0.4 + 0.3,
        training_load: Math.random() * 0.4 + 0.3,
        hrv_trend: Math.random() * 0.4 + 0.3
      },
      
      workout_intensity_history: workoutIntensityHistory,
      sleep_quality_factor: Math.random() * 0.4 + 0.5,
      hrv_trend: recoveryScore > 65 ? "improving" : "declining",
      stress_level: Math.round((100 - recoveryScore) / 10),
      
      physical_recommendations: [
        {
          title: "Light Stretching Session",
          description: "Focus on full body mobility with emphasis on any tight areas",
          duration_minutes: 15,
          priority: recoveryScore < 50 ? "high" : "medium",
          benefits: ["Improves circulation", "Releases muscle tension", "Promotes relaxation"],
          activities: ["gentle stretching", "mobility work"]
        },
        {
          title: "Recovery Walk",
          description: "Easy-paced walk in nature to promote blood flow without adding stress",
          duration_minutes: 20,
          priority: recoveryScore < 65 ? "medium" : "low",
          outdoor: true,
          benefits: ["Enhances circulation", "Minimal stress on body", "Mental refreshment"],
          activities: ["walking", "light activity"]
        }
      ],
      
      mental_recommendations: [
        {
          title: "Meditation Session",
          description: "Practice mindfulness meditation to reduce stress and promote recovery",
          duration_minutes: 10,
          priority: "medium",
          audio_link: "https://example.com/meditation.mp3",
          benefits: ["Lowers stress hormones", "Improves sleep quality", "Mental clarity"],
          activities: ["meditation", "breathing exercises"]
        }
      ],
      
      nutritional_recommendations: [
        {
          title: "Hydration Focus",
          description: "Increase water intake to support recovery and cellular function",
          priority: "high",
          specific_foods: ["water", "herbal tea", "electrolyte drink"],
          benefits: ["Supports muscle recovery", "Improves nutrient transport", "Enhances detoxification"]
        },
        {
          title: "Anti-inflammatory Foods",
          description: "Include these foods to reduce inflammation and support recovery",
          priority: "medium",
          specific_foods: ["berries", "leafy greens", "fatty fish", "turmeric", "ginger"],
          benefits: ["Reduces inflammation", "Provides antioxidants", "Supports tissue repair"]
        }
      ],
      
      sleep_recommendations: [
        {
          title: "Optimize Sleep Environment",
          description: "Ensure your bedroom is cool, dark, and quiet for optimal sleep quality",
          priority: "high",
          benefits: ["Improves deep sleep", "Enhances recovery", "Regulates hormones"]
        }
      ],
      
      suggestions: [
        "Focus on hydration today",
        "Prioritize an extra hour of sleep tonight",
        "Avoid high-intensity exercise today"
      ],
      
      recommended_recovery_windows: [
        {
          start_time: "07:30",
          end_time: "08:00",
          activities: ["Morning stretching", "Foam rolling"],
          priority: "high"
        },
        {
          start_time: "12:30",
          end_time: "13:00",
          activities: ["Breathing exercises", "Short walk"],
          priority: "medium"
        },
        {
          start_time: "19:00",
          end_time: "19:30",
          activities: ["Evening mobility", "Meditation"],
          priority: "high"
        }
      ],
      
      next_workout_recommendation: {
        recommended_type: recoveryScore < 50 ? "rest" : recoveryScore < 70 ? "light" : "moderate",
        earliest_date: new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        intensity: recoveryScore < 50 ? "very low" : recoveryScore < 70 ? "low" : "moderate",
        notes: recoveryScore < 50 ? 
          "Your body needs more time to recover. Focus on rest today." : 
          "You're recovering well, but keep intensity moderate."
      },
      
      preferred_recovery_activities: ["stretching", "walking", "yoga", "meditation"],
      available_equipment: ["foam roller", "resistance bands"],
      weather_appropriate_options: ["indoor yoga", "home stretching routine"],
      
      priority_recommendations: [
        {
          title: recoveryScore < 50 ? "Rest Day" : "Active Recovery",
          description: recoveryScore < 50 ? 
            "Your body needs a complete rest day. Avoid strenuous activity." : 
            "Focus on light activity to promote recovery without adding stress.",
          priority: "high",
          benefits: ["Enhanced recovery", "Reduced injury risk", "Improved readiness"]
        }
      ],
      
      expected_recovery_time: recoveryScore < 50 ? 
        "24-48 hours needed for optimal recovery" : 
        recoveryScore < 70 ? 
          "12-24 hours until ready for moderate training" : 
          "Ready for normal training",
      
      generated_at: new Date().toISOString()
    };
  },
  
  // User health metrics management
  getUserHealthMetrics: (metricType?: string, startDate?: string, endDate?: string): HealthMetric[] => {
    // Retrieve stored metrics from localStorage
    const storedMetrics = localStorage.getItem('user_health_metrics');
    let metrics: HealthMetric[] = storedMetrics ? JSON.parse(storedMetrics) : [];
    
    // Filter by criteria if provided
    if (metricType) {
      metrics = metrics.filter(m => m.metricType === metricType);
    }
    
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      metrics = metrics.filter(m => new Date(m.timestamp).getTime() >= startDateTime);
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate).getTime();
      metrics = metrics.filter(m => new Date(m.timestamp).getTime() <= endDateTime);
    }
    
    // Sort by timestamp (newest first)
    return metrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },
  
  addHealthMetric: (metric: Partial<HealthMetric>): HealthMetric => {
    // Generate id and user_id if not provided
    const newMetric: HealthMetric = {
      id: metric.id || `metric-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: metric.user_id || 'test_user_id',
      metricType: metric.metricType || 'custom',
      timestamp: metric.timestamp || new Date().toISOString(),
      value: metric.value || 0,
      unit: metric.unit || 'value',
      source: metric.source || 'manual_entry',
      metadata: metric.metadata || {}
    };
    
    // Get existing metrics
    const storedMetrics = localStorage.getItem('user_health_metrics');
    const metrics: HealthMetric[] = storedMetrics ? JSON.parse(storedMetrics) : [];
    
    // Add new metric and save
    metrics.push(newMetric);
    localStorage.setItem('user_health_metrics', JSON.stringify(metrics));
    
    return newMetric;
  },
  
  deleteHealthMetric: (metricId: string): boolean => {
    // Get existing metrics
    const storedMetrics = localStorage.getItem('user_health_metrics');
    if (!storedMetrics) return false;
    
    const metrics: HealthMetric[] = JSON.parse(storedMetrics);
    const initialLength = metrics.length;
    
    // Filter out the metric with the specified ID
    const filteredMetrics = metrics.filter(m => m.id !== metricId);
    
    // Save the updated metrics
    localStorage.setItem('user_health_metrics', JSON.stringify(filteredMetrics));
    
    // Return true if a metric was removed
    return filteredMetrics.length < initialLength;
  },
  
  getHealthAlerts: (): HealthAlert[] => {
    return [
      {
        id: "alert-001",
        user_id: "test_user_id",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        alert_type: "elevated_heart_rate",
        severity: "medium",
        message: "Your heart rate was unusually high during rest yesterday evening",
        data: {
          measured_bpm: 88,
          typical_resting_range: "55-70",
          time_of_measurement: new Date(Date.now() - 86400000).toISOString()
        },
        is_read: false,
        is_dismissed: false
      },
      {
        id: "alert-002",
        user_id: "test_user_id",
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        alert_type: "low_sleep_quality",
        severity: "medium",
        message: "Your sleep quality has been below average for 3 consecutive nights",
        data: {
          average_sleep_score: 65,
          typical_sleep_score: 82,
          affected_nights: 3
        },
        is_read: true,
        is_dismissed: false
      },
      {
        id: "alert-003",
        user_id: "test_user_id",
        created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        alert_type: "recovery_needed",
        severity: "high",
        message: "Your body is showing signs of accumulated fatigue. Recovery is recommended.",
        data: {
          recovery_score: 35,
          training_load: "high",
          recommendation: "Take a rest day"
        },
        is_read: true,
        is_dismissed: true
      }
    ];
  },
  
  getDemoWorkoutHistory: (filters: WorkoutFilter): WorkoutHistory => {
    // Generate demo workout history data
    const today = new Date();
    const completedWorkouts = [];
    
    // Create sample workout history for the past 30 days
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 2)); // Every other day
      
      const workoutTypes = ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio'];
      const planNames = ['Summer Shape-Up', 'Strength Builder', 'Endurance Master', 'Fitness Fundamentals'];
      
      completedWorkouts.push({
        id: `workout-${i}`,
        plan_name: planNames[i % planNames.length],
        session_name: workoutTypes[i % workoutTypes.length],
        date: date.toISOString().split('T')[0],
        duration: Math.floor(30 + Math.random() * 30), // 30-60 minutes
        calories_burned: Math.floor(200 + Math.random() * 300), // 200-500 calories
        exercises_completed: Math.floor(4 + Math.random() * 6), // 4-10 exercises
        rating: Math.floor(3 + Math.random() * 3), // 3-5 rating
        notes: i % 3 === 0 ? 'Great workout, increased weights on all exercises!' : null
      });
    }
    
    // Apply filters if provided
    let filtered = [...completedWorkouts];
    
    if (filters?.start_date) {
      filtered = filtered.filter(workout => workout.date >= filters.start_date);
    }
    
    if (filters?.end_date) {
      filtered = filtered.filter(workout => workout.date <= filters.end_date);
    }
    
    if (filters?.workout_type) {
      filtered = filtered.filter(workout => 
        workout.session_name.toLowerCase().includes(filters.workout_type.toLowerCase()));
    }
    
    // Handle pagination
    const startIndex = (filters.page - 1) * filters.limit;
    const paginatedWorkouts = filtered.slice(startIndex, startIndex + filters.limit);
    
    return {
      completed_workouts: paginatedWorkouts,
      total_pages: Math.ceil(filtered.length / filters.limit)
    };
  },
  
  generateDemoWorkoutPlan: (formState: any): WorkoutPlan => {
    // Create a demo workout plan based on user preferences
    const workoutSessions: WorkoutSession[] = [];
    const allExercises = demoMode.getDemoExercises();
    
    // Select exercises appropriate for fitness level or lower
    let levelFilter = (ex: Exercise): boolean => {
      if (formState.fitnessLevel === 'beginner') {
        return ex.difficulty === 'beginner';
      } else if (formState.fitnessLevel === 'intermediate') {
        return ex.difficulty === 'beginner' || ex.difficulty === 'intermediate';
      } else {
        return true; // All exercises for advanced
      }
    };
    
    const appropriateExercises = allExercises.filter(levelFilter);
    
    // Exercise counts based on fitness level
    const exercisesPerWorkout = formState.fitnessLevel === 'beginner' ? 4 : 
                               formState.fitnessLevel === 'intermediate' ? 6 : 8;
    
    // Repetitions based on goals
    const getSetsAndReps = (goal: string): {sets: number, reps: number | null, duration: number | null} => {
      switch(goal) {
        case 'strength':
          return { sets: 5, reps: 5, duration: null };
        case 'muscle_gain':
          return { sets: 4, reps: 10, duration: null };
        case 'weight_loss':
          return { sets: 3, reps: 15, duration: null };
        case 'endurance':
          return { sets: 3, reps: 20, duration: null };
        case 'flexibility':
          return { sets: 2, reps: null, duration: 60 };
        default: // general fitness
          return { sets: 3, reps: 12, duration: null };
      }
    };
    
    // Rest times based on goals
    const getRestTime = (goal: string): number => {
      switch(goal) {
        case 'strength':
          return 120;
        case 'muscle_gain':
          return 90;
        case 'weight_loss':
          return 45;
        case 'endurance':
          return 30;
        case 'flexibility':
          return 15;
        default: // general fitness
          return 60;
      }
    };
    
    // Generate workout sessions based on frequency and preferences
    const frequency = formState.frequency;
    
    // Filter exercises by focus areas if provided
    let filteredExercises = appropriateExercises;
    if (formState.preferences.focusAreas && formState.preferences.focusAreas.length > 0) {
      filteredExercises = appropriateExercises.filter(ex => {
        return formState.preferences.focusAreas.some((focus: string) => 
          ex.muscle_group.includes(focus.toLowerCase())
        );
      });
      
      // If no exercises match focus areas, fall back to all appropriate exercises
      if (filteredExercises.length < 3) {
        filteredExercises = appropriateExercises;
      }
    }
    
    // Generate different workout sessions based on goal
    if (formState.goal === 'strength' || formState.goal === 'muscle_gain') {
      // Create split routines for strength/muscle gain
      const strengthExercises = filteredExercises.filter(ex => 
        ex.muscle_group.some(m => ['chest', 'back', 'shoulders', 'triceps', 'biceps'].includes(m))
      );
      
      const lowerBodyExercises = filteredExercises.filter(ex => 
        ex.muscle_group.some(m => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m))
      );
      
      // Upper Body Day
      workoutSessions.push({
        day: 1,
        name: `${formState.fitnessLevel.charAt(0).toUpperCase() + formState.fitnessLevel.slice(1)} Upper Body`,
        focus: 'Chest, Back, Shoulders, Arms',
        exercises: strengthExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => {
          const { sets, reps, duration } = getSetsAndReps(formState.goal);
          return {
            exercise: ex,
            sets,
            reps,
            duration_seconds: duration,
            rest_seconds: getRestTime(formState.goal),
            notes: ''
          };
        }),
        total_duration: formState.preferences.preferredDuration || 60,
        total_calories: formState.fitnessLevel === 'beginner' ? 280 : 
                      formState.fitnessLevel === 'intermediate' ? 350 : 420,
        rest_day: false
      });
      
      // Lower Body Day
      workoutSessions.push({
        day: 3,
        name: `${formState.fitnessLevel.charAt(0).toUpperCase() + formState.fitnessLevel.slice(1)} Lower Body`,
        focus: 'Legs, Glutes, Core',
        exercises: lowerBodyExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => {
          const { sets, reps, duration } = getSetsAndReps(formState.goal);
          return {
            exercise: ex,
            sets,
            reps,
            duration_seconds: duration,
            rest_seconds: getRestTime(formState.goal),
            notes: ''
          };
        }),
        total_duration: formState.preferences.preferredDuration || 65,
        total_calories: formState.fitnessLevel === 'beginner' ? 300 : 
                      formState.fitnessLevel === 'intermediate' ? 380 : 450,
        rest_day: false
      });
    } else if (formState.goal === 'weight_loss') {
      // Create high-intensity circuit workouts for fat loss
      const cardioExercises = filteredExercises.filter(ex => 
        ex.muscle_group.some(m => ['cardio', 'full-body'].includes(m))
      );
      
      // Circuit Training
      workoutSessions.push({
        day: 1,
        name: 'Fat-Burning Circuit',
        focus: 'Full Body, Cardio',
        exercises: cardioExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => {
          const { sets, reps, duration } = getSetsAndReps(formState.goal);
          return {
            exercise: ex,
            sets,
            reps,
            duration_seconds: duration,
            rest_seconds: getRestTime(formState.goal),
            notes: ''
          };
        }),
        total_duration: formState.preferences.preferredDuration || 45,
        total_calories: formState.fitnessLevel === 'beginner' ? 320 : 
                      formState.fitnessLevel === 'intermediate' ? 380 : 450,
        rest_day: false
      });
      
      // HIIT Workout
      workoutSessions.push({
        day: 3,
        name: 'HIIT Training',
        focus: 'Cardiovascular, Fat Burning',
        exercises: cardioExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => ({
          exercise: ex,
          sets: 4,
          reps: null,
          duration_seconds: 40,
          rest_seconds: 20,
          notes: ''
        })),
        total_duration: formState.preferences.preferredDuration || 35,
        total_calories: formState.fitnessLevel === 'beginner' ? 350 : 
                      formState.fitnessLevel === 'intermediate' ? 420 : 500,
        rest_day: false
      });
    } else if (formState.goal === 'flexibility') {
      // Create flexibility-focused workouts
      const flexibilityExercises = filteredExercises.filter(ex => 
        ex.muscle_group.some(m => ['hamstrings', 'back', 'shoulders'].includes(m)) ||
        ex.name.toLowerCase().includes('stretch') ||
        ex.name.toLowerCase().includes('yoga')
      );
      
      // Stretching Routine
      workoutSessions.push({
        day: 1,
        name: 'Dynamic Flexibility',
        focus: 'Full Body Mobility',
        exercises: flexibilityExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => {
          const { sets, reps, duration } = getSetsAndReps(formState.goal);
          return {
            exercise: ex,
            sets,
            reps,
            duration_seconds: duration,
            rest_seconds: getRestTime(formState.goal),
            notes: ''
          };
        }),
        total_duration: formState.preferences.preferredDuration || 40,
        total_calories: 180,
        rest_day: false
      });
      
      // Yoga Session
      workoutSessions.push({
        day: 3,
        name: 'Yoga Flow',
        focus: 'Balance, Flexibility, Core',
        exercises: flexibilityExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => ({
          exercise: ex,
          sets: 1,
          reps: null,
          duration_seconds: 60,
          rest_seconds: 10,
          notes: ''
        })),
        total_duration: formState.preferences.preferredDuration || 45,
        total_calories: 200,
        rest_day: false
      });
    } else {
      // General fitness or endurance goals
      workoutSessions.push({
        day: 1,
        name: 'Full Body Workout',
        focus: 'Overall Fitness',
        exercises: filteredExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => {
          const { sets, reps, duration } = getSetsAndReps(formState.goal);
          return {
            exercise: ex,
            sets,
            reps,
            duration_seconds: duration,
            rest_seconds: getRestTime(formState.goal),
            notes: ''
          };
        }),
        total_duration: formState.preferences.preferredDuration || 50,
        total_calories: formState.fitnessLevel === 'beginner' ? 270 : 
                       formState.fitnessLevel === 'intermediate' ? 320 : 380,
        rest_day: false
      });
    }
    
    // Add more workout days based on frequency
    if (frequency >= 3) {
      const coreExercises = filteredExercises.filter(ex => 
        ex.muscle_group.includes('core')
      );
      
      workoutSessions.push({
        day: 5,
        name: 'Core and Mobility',
        focus: 'Core, Flexibility',
        exercises: coreExercises.slice(0, exercisesPerWorkout).map((ex: Exercise) => ({
          exercise: ex,
          sets: 3,
          reps: 15,
          duration_seconds: null,
          rest_seconds: 45,
          notes: ''
        })),
        total_duration: formState.preferences.preferredDuration || 40,
        total_calories: 240,
        rest_day: false
      });
      
      // For 4+ days per week, add another specialized workout
      if (frequency >= 4) {
        if (formState.goal === 'strength' || formState.goal === 'muscle_gain') {
          workoutSessions.push({
            day: 6,
            name: 'Arms and Shoulders',
            focus: 'Biceps, Triceps, Shoulders',
            exercises: filteredExercises.filter(ex => 
              ex.muscle_group.some(m => ['biceps', 'triceps', 'shoulders'].includes(m))
            ).slice(0, exercisesPerWorkout).map((ex: Exercise) => {
              const { sets, reps, duration } = getSetsAndReps(formState.goal);
              return {
                exercise: ex,
                sets,
                reps,
                duration_seconds: duration,
                rest_seconds: getRestTime(formState.goal),
                notes: ''
              };
            }),
            total_duration: formState.preferences.preferredDuration || 50,
            total_calories: 300,
            rest_day: false
          });
        } else if (formState.goal === 'weight_loss') {
          workoutSessions.push({
            day: 6,
            name: 'Metabolic Conditioning',
            focus: 'Cardio, Fat Burning',
            exercises: filteredExercises.filter(ex => 
              ex.muscle_group.includes('cardio')
            ).slice(0, exercisesPerWorkout).map((ex: Exercise) => ({
              exercise: ex,
              sets: 3,
              reps: null,
              duration_seconds: 45,
              rest_seconds: 15,
              notes: ''
            })),
            total_duration: formState.preferences.preferredDuration || 35,
            total_calories: 380,
            rest_day: false
          });
        } else {
          workoutSessions.push({
            day: 6,
            name: 'Active Recovery',
            focus: 'Light Cardio, Mobility',
            exercises: filteredExercises.filter(ex => 
              ex.difficulty === 'beginner'
            ).slice(0, 4).map((ex: Exercise) => ({
              exercise: ex,
              sets: 2,
              reps: 12,
              duration_seconds: null,
              rest_seconds: 30,
              notes: 'Keep intensity low to moderate'
            })),
            total_duration: 30,
            total_calories: 180,
            rest_day: false
          });
        }
      }
    }
    
    // Create rest days based on frequency
    if (frequency <= 2) {
      // For lower frequency, more rest days
      workoutSessions.push({
        day: 2,
        name: 'Rest Day',
        focus: 'Recovery',
        exercises: [],
        total_duration: 0,
        total_calories: 0,
        rest_day: true
      });
      
      workoutSessions.push({
        day: 4,
        name: 'Active Recovery',
        focus: 'Light Activity',
        exercises: [],
        total_duration: 0,
        total_calories: 0,
        rest_day: true
      });
      
      workoutSessions.push({
        day: 6,
        name: 'Rest Day',
        focus: 'Recovery',
        exercises: [],
        total_duration: 0,
        total_calories: 0,
        rest_day: true
      });
    } else {
      // For higher frequency, fewer rest days
      workoutSessions.push({
        day: 2,
        name: 'Active Recovery',
        focus: 'Light Activity, Mobility',
        exercises: [],
        total_duration: 0,
        total_calories: 0,
        rest_day: true
      });
      
      workoutSessions.push({
        day: 4,
        name: 'Rest Day',
        focus: 'Complete Rest',
        exercises: [],
        total_duration: 0,
        total_calories: 0,
        rest_day: true
      });
    }
    
    // Sort sessions by day
    workoutSessions.sort((a, b) => a.day - b.day);
    
    // Create and return the workout plan
    return {
      id: `demo-${Date.now()}`,
      name: `${formState.goal.charAt(0).toUpperCase() + formState.goal.slice(1).replace('_', ' ')} Plan`,
      description: `Custom ${formState.goal.replace('_', ' ')} plan for ${formState.fitnessLevel} fitness level, ${frequency} days per week`,
      goal: formState.goal,
      difficulty: formState.fitnessLevel,
      duration_weeks: formState.durationWeeks || 4,
      workout_sessions: workoutSessions,
      created_at: new Date().toISOString()
    };
    
    const newWorkoutPlan: WorkoutPlan = {
      id: `demo-plan-${Date.now()}`,
      name: `${formState.goal.replace('_', ' ').charAt(0).toUpperCase() + formState.goal.replace('_', ' ').slice(1)} Plan`,
      description: `A ${formState.durationWeeks}-week ${formState.goal.replace('_', ' ')} program tailored for ${formState.fitnessLevel} level.`,
      goal: formState.goal,
      duration_weeks: formState.durationWeeks,
      difficulty: formState.fitnessLevel,
      workout_sessions: workoutSessions,
      created_at: new Date().toISOString()
    };
    
    // Add the new plan to the demoWorkoutPlans array
    demoWorkoutPlans.push(newWorkoutPlan);
    
    return newWorkoutPlan;
  },
  
  // Demo data for when API is not available
  getDemoUserProfile: (): UserProfile => ({
    user_id: 'demo-user',
    name: 'Demo User',
    email: 'demo@example.com',
    age: 32,
    gender: 'male',
    height_cm: 175,
    weight_kg: 75,
    fitness_level: 'intermediate',
    activity_level: 'active',
    fitness_goal: 'strength',
    preferred_workout_duration: 60,
    preferred_workout_days: 4,
    equipment_access: true,
    injuries: [],
    workout_preferences: ['weightlifting', 'hiit'],
    achievements: [
      {
        id: 'achievement-001',
        title: 'Early Bird',
        description: 'Complete 5 workouts before 8am',
        category: 'consistency',
        icon: '🌅',
        color: '#FF9500',
        earned: true,
        earned_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        level: 1
      },
      {
        id: 'achievement-002',
        title: 'Strength Master',
        description: 'Lift 5000kg total weight in a single week',
        category: 'milestone',
        icon: '💪',
        color: '#007AFF',
        earned: true,
        earned_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        level: 1
      },
      {
        id: 'achievement-003',
        title: 'Workout Streak',
        description: 'Complete workouts for 7 consecutive days',
        category: 'consistency',
        icon: '🔥',
        color: '#FF3B30',
        earned: false,
        progress: 71
      }
    ],
    level: 5,
    experiencePoints: 1240,
    xpRules: [
      {
        id: 'xp-rule-001',
        activity: 'Complete a workout',
        description: 'Earn XP each time you complete a workout session',
        xpAmount: 50,
        category: 'workout',
        frequency: 'unlimited'
      },
      {
        id: 'xp-rule-002',
        activity: 'Exercise streak',
        description: 'Keep your workout streak going for bonus XP',
        xpAmount: 100,
        category: 'workout',
        frequency: 'daily',
        bonusMultiplier: 1.25
      },
      {
        id: 'xp-rule-003',
        activity: 'Try a new exercise',
        description: 'Earn XP when you try an exercise for the first time',
        xpAmount: 30,
        category: 'workout',
        frequency: 'once'
      },
      {
        id: 'xp-rule-004',
        activity: 'Complete a goal',
        description: 'Earn XP when you reach one of your fitness goals',
        xpAmount: 200,
        category: 'goal',
        frequency: 'once'
      },
      {
        id: 'xp-rule-005',
        activity: 'Log daily meals',
        description: 'Track your nutrition consistently',
        xpAmount: 20,
        category: 'health',
        frequency: 'daily'
      }
    ],
    levelRewards: [
      {
        id: 'reward-001',
        name: 'Beginner Badge',
        description: 'You\'ve started your fitness journey!',
        levelRequired: 1,
        type: 'badge',
        claimed: true
      },
      {
        id: 'reward-002',
        name: 'Custom Workout Access',
        description: 'Create your own custom workouts',
        levelRequired: 3,
        type: 'feature',
        claimed: true
      },
      {
        id: 'reward-003',
        name: 'Advanced Analytics',
        description: 'Get deeper insights into your fitness progress',
        levelRequired: 5,
        type: 'feature',
        claimed: false
      },
      {
        id: 'reward-004',
        name: '10% Shop Discount',
        description: 'Discount on fitness equipment and supplements',
        levelRequired: 7,
        type: 'discount',
        claimed: false
      },
      {
        id: 'reward-005',
        name: 'Elite Training Program',
        description: 'Access to premium workout programs',
        levelRequired: 10,
        type: 'content',
        claimed: false
      }
    ],
    medals: [
      {
        id: 'medal-001',
        name: 'Strength Starter',
        description: 'Complete your first strength workout',
        category: 'strength',
        tier: 'bronze',
        earned: true,
        earnedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        image: '💪',
        requirement: 'Complete a strength training session'
      },
      {
        id: 'medal-002',
        name: 'Cardio Champion',
        description: 'Complete 10 cardio workouts',
        category: 'endurance',
        tier: 'silver',
        earned: true,
        earnedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        image: '🏃',
        requirement: 'Complete 10 cardio sessions'
      },
      {
        id: 'medal-003',
        name: 'Weight Loss Warrior',
        description: 'Lose 5kg of body weight',
        category: 'weight',
        tier: 'gold',
        earned: false,
        image: '⚖️',
        requirement: 'Lose 5kg from your starting weight'
      },
      {
        id: 'medal-004',
        name: 'Perfect Week',
        description: 'Complete all planned workouts for a week',
        category: 'consistency',
        tier: 'bronze',
        earned: true,
        earnedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        image: '📅',
        requirement: 'Complete all scheduled workouts for one week'
      },
      {
        id: 'medal-005',
        name: 'Nutrition Master',
        description: 'Log your meals for 30 consecutive days',
        category: 'nutrition',
        tier: 'platinum',
        earned: false,
        image: '🥗',
        requirement: 'Log all meals for 30 days straight'
      },
      {
        id: 'medal-006',
        name: 'Fitness Legend',
        description: 'Reach level 10 in the fitness system',
        category: 'achievement',
        tier: 'diamond',
        earned: false,
        image: '👑',
        requirement: 'Reach level 10'
      }
    ],
    goals: [
      {
        id: 'goal-001',
        user_id: 'demo-user',
        title: 'Lose 5kg',
        description: 'Reach target weight of 70kg',
        category: 'weight',
        target_value: 70,
        current_value: 75,
        unit: 'kg',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        progress: 0,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        milestones: [
          {
            id: 'milestone-001-1',
            title: 'First kg',
            target_value: 74,
            achieved: false
          },
          {
            id: 'milestone-001-2',
            title: 'Halfway there',
            target_value: 72.5,
            achieved: false
          }
        ]
      },
      {
        id: 'goal-002',
        user_id: 'demo-user',
        title: 'Run 5k in 30 minutes',
        description: 'Improve running endurance and speed',
        category: 'endurance',
        target_value: 30,
        current_value: 35,
        unit: 'minutes',
        start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        progress: 33,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        milestones: [
          {
            id: 'milestone-002-1',
            title: 'Run 5k in 35 minutes',
            target_value: 35,
            achieved: true,
            achieved_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'milestone-002-2',
            title: 'Run 5k in 32 minutes',
            target_value: 32,
            achieved: false
          }
        ]
      },
      {
        id: 'goal-003',
        user_id: 'demo-user',
        title: 'Do 10 pull-ups in a row',
        description: 'Build upper body strength',
        category: 'strength',
        target_value: 10,
        current_value: 6,
        unit: 'reps',
        start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        progress: 60,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        milestones: [
          {
            id: 'milestone-003-1',
            title: '5 pull-ups',
            target_value: 5,
            achieved: true,
            achieved_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ]
  }),
  
  getDemoDashboardData: (): FitnessDashboardData => ({
    active_plan: {
    id: 'demo-plan',
    name: 'Strength Building Program',
    description: 'A 6-week program focused on building overall strength',
    goal: 'strength',
    duration_weeks: 6,
    difficulty: 'intermediate',
    workout_sessions: [],
    created_at: new Date().toISOString()
  },
    upcoming_workout: {
      day: 2,
      name: 'Upper Body Strength',
      focus: 'Chest, Back, Shoulders',
      exercises: [],
      total_duration: 60,
      total_calories: 350,
      rest_day: false
    },
    workout_streak: 8,
    total_workouts_completed: 24,
    total_calories_burned: 8450,
    weekly_activity_summary: [
      { date: '2025-08-22', calories_burned: 320, minutes_active: 45, workouts_completed: 1 },
      { date: '2025-08-23', calories_burned: 0, minutes_active: 0, workouts_completed: 0 },
      { date: '2025-08-24', calories_burned: 280, minutes_active: 35, workouts_completed: 1 },
      { date: '2025-08-25', calories_burned: 350, minutes_active: 65, workouts_completed: 1 },
      { date: '2025-08-26', calories_burned: 0, minutes_active: 0, workouts_completed: 0 },
      { date: '2025-08-27', calories_burned: 400, minutes_active: 70, workouts_completed: 1 },
      { date: '2025-08-28', calories_burned: 0, minutes_active: 0, workouts_completed: 0 },
    ],
    fitness_stats: {
      current_weight: 74.2,
      starting_weight: 75,
      weight_change: -0.8,
      workout_consistency: 85,
    }
  }),
  
  getDemoWorkoutPlans: (): WorkoutPlan[] => {
    return demoWorkoutPlans;
  },
  

  
  getDemoExercises: (): Exercise[] => [
    // Strength and Muscle Gain Exercises
    {
      id: 'ex-001',
      name: 'Barbell Bench Press',
      description: 'A compound exercise that targets the chest, shoulders, and triceps',
      muscle_group: ['chest', 'shoulders', 'triceps'],
      difficulty: 'intermediate',
      equipment_required: ['barbell', 'bench'],
      instructions: [
        'Lie on a bench with your feet flat on the ground',
        'Grip the barbell with hands slightly wider than shoulder-width',
        'Lower the bar to your chest',
        'Press the bar back up to starting position',
      ],
      duration: 45,
      calories_burned: 8,
      image_url: 'https://example.com/bench-press.jpg'
    },
    {
      id: 'ex-002',
      name: 'Squat',
      description: 'A compound exercise that primarily targets the quadriceps, hamstrings, and glutes',
      muscle_group: ['quadriceps', 'hamstrings', 'glutes'],
      difficulty: 'intermediate',
      equipment_required: ['barbell', 'squat rack'],
      instructions: [
        'Stand with feet shoulder-width apart',
        'Place barbell across upper back',
        'Bend knees and lower body until thighs are parallel to floor',
        'Return to starting position'
      ],
      duration: 60,
      calories_burned: 10,
      image_url: 'https://example.com/squat.jpg'
    },
    {
      id: 'ex-003',
      name: 'Deadlift',
      description: 'A powerful compound exercise that engages multiple muscle groups',
      muscle_group: ['back', 'glutes', 'hamstrings', 'core'],
      difficulty: 'advanced',
      equipment_required: ['barbell'],
      instructions: [
        'Stand with feet hip-width apart, barbell over midfoot',
        'Bend at hips and knees, grasp bar with hands shoulder-width apart',
        'Keep back flat, lift chest, and drive through heels',
        'Stand up straight, then return the bar to the ground'
      ],
      duration: 60,
      calories_burned: 12,
      image_url: 'https://example.com/deadlift.jpg'
    },
    {
      id: 'ex-004',
      name: 'Overhead Press',
      description: 'A fundamental shoulder strengthening exercise',
      muscle_group: ['shoulders', 'triceps'],
      difficulty: 'intermediate',
      equipment_required: ['barbell'],
      instructions: [
        'Stand with feet shoulder-width apart, barbell at shoulder height',
        'Press the bar overhead until arms are fully extended',
        'Lower the bar back to shoulder level with control',
        'Repeat the movement'
      ],
      duration: 40,
      calories_burned: 7,
      image_url: 'https://example.com/overhead-press.jpg'
    },
    {
      id: 'ex-005',
      name: 'Barbell Row',
      description: 'A compound pulling movement for back development',
      muscle_group: ['back', 'biceps', 'shoulders'],
      difficulty: 'intermediate',
      equipment_required: ['barbell'],
      instructions: [
        'Bend at the hips with knees slightly bent, holding a barbell',
        'Keep back flat and pull the barbell toward your lower ribcage',
        'Lower the barbell with control back to the starting position',
        'Repeat while maintaining proper form'
      ],
      duration: 45,
      calories_burned: 8,
      image_url: 'https://example.com/barbell-row.jpg'
    },
    
    // Weight Loss Exercises
    {
      id: 'ex-006',
      name: 'Burpees',
      description: 'A full-body exercise that elevates heart rate and burns calories',
      muscle_group: ['full-body', 'core'],
      difficulty: 'intermediate',
      equipment_required: [],
      instructions: [
        'Start in a standing position',
        'Drop into a squat position and place hands on the ground',
        'Kick feet back into a plank position',
        'Immediately return feet to squat position and jump up explosively'
      ],
      duration: 30,
      calories_burned: 10,
      image_url: 'https://example.com/burpees.jpg'
    },
    {
      id: 'ex-007',
      name: 'Mountain Climbers',
      description: 'A dynamic cardio exercise that targets the core and elevates heart rate',
      muscle_group: ['core', 'shoulders', 'cardio'],
      difficulty: 'beginner',
      equipment_required: [],
      instructions: [
        'Start in a high plank position with hands under shoulders',
        'Drive one knee toward chest, then quickly switch legs',
        'Continue alternating legs at a rapid pace',
        'Keep your core engaged throughout'
      ],
      duration: 45,
      calories_burned: 9,
      image_url: 'https://example.com/mountain-climbers.jpg'
    },
    {
      id: 'ex-008',
      name: 'Jumping Jacks',
      description: 'A classic cardio exercise that raises heart rate',
      muscle_group: ['full-body', 'cardio'],
      difficulty: 'beginner',
      equipment_required: [],
      instructions: [
        'Start standing with feet together and arms at sides',
        'Jump up, spreading feet wider than hip-width and bringing arms overhead',
        'Jump back to starting position',
        'Repeat at a moderate to fast pace'
      ],
      duration: 60,
      calories_burned: 8,
      image_url: 'https://example.com/jumping-jacks.jpg'
    },
    
    // Endurance Exercises
    {
      id: 'ex-009',
      name: 'High Knees',
      description: 'A cardio exercise that improves endurance and coordination',
      muscle_group: ['legs', 'cardio', 'core'],
      difficulty: 'beginner',
      equipment_required: [],
      instructions: [
        'Stand with feet hip-width apart',
        'Run in place, lifting knees as high as possible',
        'Maintain a quick pace and pump arms',
        'Keep core engaged throughout'
      ],
      duration: 60,
      calories_burned: 9,
      image_url: 'https://example.com/high-knees.jpg'
    },
    {
      id: 'ex-010',
      name: 'Jump Rope',
      description: 'An effective cardio exercise for endurance and coordination',
      muscle_group: ['legs', 'cardio', 'shoulders'],
      difficulty: 'beginner',
      equipment_required: ['jump rope'],
      instructions: [
        'Hold jump rope handles with a relaxed grip',
        'Rotate wrists to swing rope and jump as it approaches feet',
        'Land softly on balls of feet',
        'Maintain a steady rhythm'
      ],
      duration: 120,
      calories_burned: 14,
      image_url: 'https://example.com/jump-rope.jpg'
    },
    
    // Flexibility Exercises
    {
      id: 'ex-011',
      name: 'Downward Dog',
      description: 'A yoga pose that stretches the hamstrings, calves, and shoulders',
      muscle_group: ['hamstrings', 'shoulders', 'back'],
      difficulty: 'beginner',
      equipment_required: ['yoga mat'],
      instructions: [
        'Start in a plank position',
        'Push hips up and back, forming an inverted V shape',
        'Press heels toward the floor and relax head between arms',
        'Hold the position while breathing deeply'
      ],
      duration: 60,
      calories_burned: 3,
      image_url: 'https://example.com/downward-dog.jpg'
    },
    {
      id: 'ex-012',
      name: 'Seated Forward Bend',
      description: 'A yoga pose that stretches the spine, hamstrings, and lower back',
      muscle_group: ['hamstrings', 'back'],
      difficulty: 'beginner',
      equipment_required: ['yoga mat'],
      instructions: [
        'Sit on the floor with legs extended straight in front',
        'Inhale, lengthening the spine',
        'Exhale and hinge at the hips to fold forward',
        'Hold the position and breathe deeply'
      ],
      duration: 45,
      calories_burned: 2,
      image_url: 'https://example.com/seated-forward-bend.jpg'
    },
    
    // Core Exercises
    {
      id: 'ex-013',
      name: 'Plank',
      description: 'An isometric core strengthening exercise',
      muscle_group: ['core', 'shoulders', 'back'],
      difficulty: 'beginner',
      equipment_required: [],
      instructions: [
        'Start in a forearm position with elbows under shoulders',
        'Extend legs back with feet hip-width apart',
        'Form a straight line from head to heels',
        'Hold the position while breathing normally'
      ],
      duration: 60,
      calories_burned: 5,
      image_url: 'https://example.com/plank.jpg'
    },
    {
      id: 'ex-014',
      name: 'Russian Twists',
      description: 'A rotational exercise that targets the obliques',
      muscle_group: ['core', 'obliques'],
      difficulty: 'beginner',
      equipment_required: ['dumbbell'],
      instructions: [
        'Sit on the floor with knees bent and feet lifted slightly',
        'Lean back slightly to engage core',
        'Hold hands together or hold a weight, and rotate torso side to side',
        'Touch the floor on each side with each twist'
      ],
      duration: 45,
      calories_burned: 6,
      image_url: 'https://example.com/russian-twists.jpg'
    },
    {
      id: 'ex-015',
      name: 'Bicycle Crunches',
      description: 'A dynamic core exercise targeting abs and obliques',
      muscle_group: ['core', 'obliques'],
      difficulty: 'beginner',
      equipment_required: [],
      instructions: [
        'Lie on your back with hands behind head and knees bent',
        'Lift shoulders off the ground and bring right elbow to left knee',
        'Simultaneously extend right leg',
        'Switch sides in a pedaling motion'
      ],
      duration: 60,
      calories_burned: 8,
      image_url: 'https://example.com/bicycle-crunches.jpg'
    }
  ]
};

export default apiClient;
