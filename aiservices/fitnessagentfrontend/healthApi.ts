// Health monitoring related types and API methods
import { apiClient } from './api';

// Health data types
export interface HealthMetric {
  id: string;
  user_id: string;
  metricType: string;
  timestamp: string;
  value: number;
  unit: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface HeartRateData {
  bpm: number;
  timestamp: string;
  activity_state: string;
  confidence?: number;
}

export interface SleepData {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  deep_sleep_minutes?: number;
  light_sleep_minutes?: number;
  rem_sleep_minutes?: number;
  awake_minutes?: number;
  sleep_score?: number;
  interruptions?: number;
}

export interface ActivityData {
  count: number;
  timestamp: string;
  distance_meters?: number;
  floors_climbed?: number;
  elevation_gain?: number;
}

export interface CalorieData {
  total: number;
  timestamp: string;
  active?: number;
  resting?: number;
  activity_type?: string;
}

export interface HealthSummary {
  date: string;
  steps: {
    total: number;
    goal_progress: number;
  };
  sleep: {
    duration_hours: number | null;
    quality_score: number | null;
    deep_sleep_hours: number | null;
  };
  calories: {
    total: number;
  };
  heart_rate: {
    average: number | null;
    min: number | null;
    max: number | null;
  };
  recovery: {
    score: number;
    status: string;
    factors: Record<string, number>;
  };
}

export interface HealthAlert {
  id: string;
  user_id: string;
  created_at: string;
  alert_type: string;
  severity: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
}

export interface RecoveryRecommendation {
  title: string;
  description: string;
  duration_minutes?: number;
  priority: string;
  video_link?: string;
  audio_link?: string;
  outdoor?: boolean;
  equipment_needed?: string[];
  suitable_for?: string[];
  specific_foods?: string[];
  benefits: string[];
  activities?: string[];
  custom_target?: string;
}

export interface RecoveryWindow {
  start_time: string;
  end_time: string;
  activities: string[];
  priority: string;
}

export interface NextWorkoutRecommendation {
  recommended_type: string;
  earliest_date: string;
  intensity: string;
  notes: string;
}

export interface RecoveryAdvice {
  id: string;
  user_id: string;
  title: string;
  description: string;
  advice_date: string;
  
  // Overall recovery metrics
  recovery_score: number;
  recovery_status: string;
  factors: Record<string, number>;
  
  // Personalization factors
  workout_intensity_history: Record<string, number>;
  sleep_quality_factor: number;
  hrv_trend: string;
  stress_level: number;
  
  // Categorized recommendations
  physical_recommendations: RecoveryRecommendation[];
  mental_recommendations: RecoveryRecommendation[];
  nutritional_recommendations: RecoveryRecommendation[];
  sleep_recommendations: RecoveryRecommendation[];
  
  // Legacy field
  suggestions: string[];
  
  // Schedule and timing
  recommended_recovery_windows: RecoveryWindow[];
  next_workout_recommendation: NextWorkoutRecommendation;
  
  // User preference factors
  preferred_recovery_activities: string[];
  available_equipment: string[];
  weather_appropriate_options: string[];
  
  // Summary fields
  priority_recommendations: RecoveryRecommendation[];
  expected_recovery_time: string;
  
  generated_at: string;
}

export interface WearableDevice {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  last_sync?: string;
  battery_level?: number;
  connected: boolean;
}

// API client methods
export async function getHeartRateData(
  startTime?: string,
  endTime?: string,
  activityState?: string,
  limit = 100
): Promise<HeartRateData[]> {
  let url = '/api/v1/health/heart-rate';
  const params = new URLSearchParams();
  
  if (startTime) params.append('start_time', startTime);
  if (endTime) params.append('end_time', endTime);
  if (activityState) params.append('activity_state', activityState);
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`${url}?${params.toString()}`);
  return response.data;
}

export async function getSleepData(
  startDate?: string,
  endDate?: string,
  limit = 10
): Promise<SleepData[]> {
  let url = '/api/v1/health/sleep';
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`${url}?${params.toString()}`);
  return response.data;
}

export async function getActivityData(
  startDate?: string,
  endDate?: string
): Promise<ActivityData[]> {
  let url = '/api/v1/health/steps';
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await apiClient.get(`${url}?${params.toString()}`);
  return response.data;
}

export async function getHealthSummary(date?: string): Promise<HealthSummary> {
  let url = '/api/v1/health/summary';
  if (date) url += `?date=${date}`;
  
  const response = await apiClient.get(url);
  return response.data;
}

export async function getHealthAlerts(
  startDate?: string,
  endDate?: string,
  severity?: string,
  dismissed = false,
  limit = 20
): Promise<HealthAlert[]> {
  let url = '/api/v1/health/insights';
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (severity) params.append('severity', severity);
  params.append('dismissed', dismissed.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`${url}?${params.toString()}`);
  return response.data;
}

export async function dismissHealthAlert(alertId: string): Promise<void> {
  await apiClient.put(`/api/v1/health/insights/${alertId}/dismiss`);
}

export async function getRecoveryAdvice(date?: string, refresh = false): Promise<RecoveryAdvice> {
  let url = '/api/v1/health/recovery';
  const params = new URLSearchParams();
  
  if (date) params.append('date', date);
  if (refresh) params.append('refresh', 'true');
  
  const response = await apiClient.get(`${url}?${params.toString()}`);
  return response.data;
}

export async function getConnectedDevices(): Promise<WearableDevice[]> {
  const response = await apiClient.get('/api/v1/health/devices');
  return response.data;
}

export async function connectWearableDevice(deviceInfo: {
  deviceName: string;
  deviceType: string;
  authToken?: string;
}): Promise<WearableDevice> {
  const response = await apiClient.post('/api/v1/health/devices', deviceInfo);
  return response.data;
}

export async function disconnectWearableDevice(deviceId: string): Promise<void> {
  await apiClient.delete(`/api/v1/health/devices/${deviceId}`);
}

export async function getAvailableDevices(): Promise<WearableDevice[]> {
  const response = await apiClient.get('/api/v1/health/devices/available');
  return response.data;
}

export async function syncWearableData(deviceId: string): Promise<void> {
  await apiClient.post(`/api/v1/health/devices/${deviceId}/sync`);
}

// User health data management functions
export async function addHealthMetric(metric: Partial<HealthMetric>): Promise<HealthMetric> {
  const response = await apiClient.post('/api/v1/health/metrics', metric);
  return response.data;
}

export async function getUserHealthMetrics(
  metricType?: string,
  startDate?: string,
  endDate?: string,
  limit = 50
): Promise<HealthMetric[]> {
  let url = '/api/v1/health/metrics';
  const params = new URLSearchParams();
  
  if (metricType) params.append('metric_type', metricType);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`${url}?${params.toString()}`);
  return response.data;
}

export async function deleteHealthMetric(metricId: string): Promise<void> {
  await apiClient.delete(`/api/v1/health/metrics/${metricId}`);
}
