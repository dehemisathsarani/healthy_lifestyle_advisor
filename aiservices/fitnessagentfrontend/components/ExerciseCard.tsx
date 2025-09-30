import React from 'react';
import { type Exercise } from '../api';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
    >
      <div className="h-40 bg-gray-200 overflow-hidden">
        {exercise.image_url ? (
          <img 
            src={exercise.image_url} 
            alt={`${exercise.name} exercise`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
            {exercise.difficulty}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{exercise.description}</p>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {exercise.muscle_groups.map((muscle, idx) => (
            <span 
              key={idx}
              className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ exercise, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="h-64 bg-gray-200 overflow-hidden">
            {exercise.image_url ? (
              <img 
                src={exercise.image_url} 
                alt={`${exercise.name} exercise`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-gray-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{exercise.name}</h2>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800">
              {exercise.difficulty}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {exercise.muscle_groups.map((muscle, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
              >
                {muscle}
              </span>
            ))}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{exercise.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ol className="list-decimal pl-5 space-y-2">
              {exercise.instructions.map((step, idx) => (
                <li key={idx} className="text-gray-700">{step}</li>
              ))}
            </ol>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Equipment</p>
              <p className="font-medium text-gray-900">{exercise.equipment.join(', ') || 'None'}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{exercise.type}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Calories</p>
              <p className="font-medium text-gray-900">{exercise.calories_per_min} cal/min</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Target Sets</p>
              <p className="font-medium text-gray-900">{exercise.recommended_sets || '-'}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Target Reps</p>
              <p className="font-medium text-gray-900">{exercise.recommended_reps || '-'}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Rest Period</p>
              <p className="font-medium text-gray-900">{exercise.recommended_rest ? `${exercise.recommended_rest}s` : '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseCard;
