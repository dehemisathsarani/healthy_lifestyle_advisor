import React, { useState } from 'react';
import { Smile, Frown, Meh, Zap, Heart, Star } from 'lucide-react';
import type { MoodFormData } from '../types/enhancedMoodTracker.ts';

interface MoodFormProps {
  onSubmit: (data: MoodFormData) => void;
  isLoading: boolean;
}

const MoodForm: React.FC<MoodFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<MoodFormData>({
    moodType: '',
    rating: 0,
    description: '',
    factors: []
  });

  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  const moodTypes = [
    { id: 'happy', label: 'Happy', icon: Smile, color: 'bg-green-500' },
    { id: 'sad', label: 'Sad', icon: Frown, color: 'bg-blue-500' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'bg-gray-500' },
    { id: 'excited', label: 'Excited', icon: Zap, color: 'bg-yellow-500' },
    { id: 'anxious', label: 'Anxious', icon: Heart, color: 'bg-red-500' },
    { id: 'content', label: 'Content', icon: Star, color: 'bg-purple-500' }
  ];

  const moodFactors = [
    'Work/School', 'Relationships', 'Health', 'Weather', 'Sleep',
    'Exercise', 'Social Media', 'News', 'Money', 'Family',
    'Friends', 'Food', 'Music', 'Nature', 'Achievement'
  ];

  const handleMoodTypeSelect = (moodType: string) => {
    setFormData(prev => ({ ...prev, moodType }));
  };

  const handleRatingSelect = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleFactorToggle = (factor: string) => {
    setSelectedFactors(prev => {
      const updated = prev.includes(factor)
        ? prev.filter(f => f !== factor)
        : [...prev, factor];
      setFormData(prevData => ({ ...prevData, factors: updated }));
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.moodType && formData.rating > 0) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.moodType && formData.rating > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mood Type Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">How would you describe your mood?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {moodTypes.map((mood) => {
            const IconComponent = mood.icon;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => handleMoodTypeSelect(mood.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.moodType === mood.id
                    ? `${mood.color} text-white border-transparent shadow-lg transform scale-105`
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <IconComponent className="w-6 h-6 mx-auto mb-2" />
                <span className="block text-sm font-medium">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensity Rating */}
      {formData.moodType && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">How intense is this feeling? (1-10)</h3>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingSelect(rating)}
                className={`w-12 h-12 rounded-full border-2 font-semibold transition-all duration-200 ${
                  formData.rating === rating
                    ? 'bg-purple-500 text-white border-purple-500 transform scale-110'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            <span>Very Low</span>
            <span className="float-right">Very High</span>
          </div>
        </div>
      )}

      {/* Description */}
      {formData.rating > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Tell us more about it (optional)</h3>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What's on your mind? Any specific thoughts or situations contributing to your mood?"
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none min-h-[100px] transition-all duration-200"
            rows={4}
          />
        </div>
      )}

      {/* Contributing Factors */}
      {formData.rating > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">What might be influencing your mood? (optional)</h3>
          <div className="flex flex-wrap gap-2">
            {moodFactors.map((factor) => (
              <button
                key={factor}
                type="button"
                onClick={() => handleFactorToggle(factor)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFactors.includes(factor)
                    ? 'bg-purple-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {factor}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {isFormValid && (
        <div className="text-center pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Analyzing Your Mood...
              </span>
            ) : (
              'Get My Personalized Recommendations 🎯'
            )}
          </button>
        </div>
      )}
    </form>
  );
};

export default MoodForm;