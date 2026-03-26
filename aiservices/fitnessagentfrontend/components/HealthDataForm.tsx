import React, { useState } from 'react';
import { HealthMetric } from '../healthApi';

interface HealthDataFormProps {
  onSubmit: (data: Partial<HealthMetric>) => void;
  loading: boolean;
}

const HealthDataForm: React.FC<HealthDataFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    metricType: 'heart_rate',
    value: '',
    timestamp: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data based on the metric type
    const metricData: Partial<HealthMetric> = {
      metricType: formData.metricType,
      timestamp: new Date(formData.timestamp).toISOString(),
      value: parseFloat(formData.value),
      source: 'manual_entry',
      metadata: {
        notes: formData.notes,
      },
    };

    // Add the appropriate unit based on the metric type
    let unit = '';
    switch (formData.metricType) {
      case 'heart_rate':
        unit = 'bpm';
        break;
      case 'blood_pressure':
        unit = 'mmHg';
        break;
      case 'weight':
        unit = 'kg';
        break;
      case 'steps':
        unit = 'count';
        break;
      case 'sleep':
        unit = 'hours';
        break;
      case 'water':
        unit = 'ml';
        break;
      default:
        unit = 'value';
    }

    onSubmit({
      ...metricData,
      unit,
    });

    // Reset value and notes, but keep the metric type and date
    setFormData({
      ...formData,
      value: '',
      notes: '',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Log Health Metrics</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="metricType" className="block text-sm font-medium text-gray-700 mb-1">
              Metric Type
            </label>
            <select
              id="metricType"
              name="metricType"
              value={formData.metricType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="heart_rate">Heart Rate</option>
              <option value="blood_pressure">Blood Pressure</option>
              <option value="weight">Weight</option>
              <option value="steps">Steps</option>
              <option value="sleep">Sleep Duration</option>
              <option value="water">Water Intake</option>
              <option value="custom">Custom Metric</option>
            </select>
          </div>
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
              Value
              {formData.metricType === 'heart_rate' && ' (bpm)'}
              {formData.metricType === 'blood_pressure' && ' (mmHg)'}
              {formData.metricType === 'weight' && ' (kg)'}
              {formData.metricType === 'steps' && ' (count)'}
              {formData.metricType === 'sleep' && ' (hours)'}
              {formData.metricType === 'water' && ' (ml)'}
            </label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder={formData.metricType === 'blood_pressure' ? '120/80' : '0'}
              required
              step="0.01"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">
            Date/Time
          </label>
          <input
            type="date"
            id="timestamp"
            name="timestamp"
            value={formData.timestamp}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Add any relevant details about this measurement..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md font-medium text-white ${
              loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Saving...' : 'Save Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthDataForm;
