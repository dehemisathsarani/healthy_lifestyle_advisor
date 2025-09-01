export interface HealthMetric {
  id: string;
  type: string;
  value: number | string;
  unit: string;
  timestamp: string;
  notes?: string;
}

// Define specific metric types
export type MetricType = 
  | 'heart_rate'
  | 'blood_pressure' 
  | 'weight'
  | 'steps'
  | 'sleep'
  | 'water'
  | 'custom';

export interface MetricConfig {
  type: MetricType;
  label: string;
  unit: string;
  icon?: string;
  defaultValue?: number | string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  format?: (value: number | string) => string;
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  heart_rate: {
    type: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    minValue: 30,
    maxValue: 220,
    step: 1,
    defaultValue: 70,
  },
  blood_pressure: {
    type: 'blood_pressure',
    label: 'Blood Pressure',
    unit: 'mmHg',
    format: (value) => {
      if (typeof value === 'string' && value.includes('/')) {
        return value;
      }
      return '120/80'; // Default value
    }
  },
  weight: {
    type: 'weight',
    label: 'Weight',
    unit: 'kg',
    minValue: 20,
    maxValue: 300,
    step: 0.1,
    defaultValue: 70,
  },
  steps: {
    type: 'steps',
    label: 'Steps',
    unit: 'steps',
    minValue: 0,
    maxValue: 100000,
    step: 1,
    defaultValue: 0,
  },
  sleep: {
    type: 'sleep',
    label: 'Sleep Duration',
    unit: 'hours',
    minValue: 0,
    maxValue: 24,
    step: 0.25,
    defaultValue: 8,
    format: (value) => {
      const hours = Math.floor(Number(value));
      const minutes = Math.round((Number(value) - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
  },
  water: {
    type: 'water',
    label: 'Water Intake',
    unit: 'ml',
    minValue: 0,
    maxValue: 5000,
    step: 50,
    defaultValue: 0,
  },
  custom: {
    type: 'custom',
    label: 'Custom Metric',
    unit: '',
    defaultValue: '',
  }
};

// Helper functions for formatting health metric values
export const formatMetricValue = (metric: HealthMetric): string => {
  const config = METRIC_CONFIGS[metric.type as MetricType];
  
  if (config?.format) {
    return config.format(metric.value);
  }
  
  if (metric.type === 'blood_pressure' && typeof metric.value === 'string') {
    return metric.value; // Already formatted as "systolic/diastolic"
  }
  
  return `${metric.value} ${metric.unit}`;
};

export const getMetricColor = (metric: HealthMetric): string => {
  switch (metric.type) {
    case 'heart_rate':
      const hr = Number(metric.value);
      if (hr < 60) return 'text-blue-600';
      if (hr > 100) return 'text-red-600';
      return 'text-green-600';
    
    case 'blood_pressure':
      if (typeof metric.value === 'string') {
        const [systolic, diastolic] = metric.value.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) return 'text-red-600';
        if (systolic < 90 || diastolic < 60) return 'text-blue-600';
        return 'text-green-600';
      }
      return 'text-gray-600';
      
    case 'weight':
      return 'text-indigo-600';
      
    case 'steps':
      const steps = Number(metric.value);
      if (steps < 5000) return 'text-yellow-600';
      if (steps > 10000) return 'text-green-600';
      return 'text-blue-600';
      
    case 'sleep':
      const sleep = Number(metric.value);
      if (sleep < 6) return 'text-yellow-600';
      if (sleep > 9) return 'text-blue-600';
      return 'text-green-600';
      
    case 'water':
      const water = Number(metric.value);
      if (water < 1500) return 'text-yellow-600';
      if (water > 3000) return 'text-green-600';
      return 'text-blue-600';
      
    default:
      return 'text-gray-600';
  }
};
