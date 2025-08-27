import React from 'react';

interface MacroCardProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: string;
}

const MacroCard: React.FC<MacroCardProps> = ({ 
  name, 
  current, 
  target, 
  unit, 
  color,
  icon 
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isExceeded = current > target;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${isExceeded ? 'text-red-600' : 'text-gray-600'}`}>
            {current.toFixed(1)} / {target.toFixed(1)} {unit}
          </p>
          <p className={`text-xs ${isExceeded ? 'text-red-500' : 'text-gray-500'}`}>
            {percentage.toFixed(0)}%
          </p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            isExceeded ? 'bg-red-500' : `bg-${color}-500`
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isExceeded && (
        <p className="text-xs text-red-500 mt-2">
          ⚠️ Exceeded target by {(current - target).toFixed(1)} {unit}
        </p>
      )}
      
      {percentage < 50 && !isExceeded && (
        <p className="text-xs text-orange-500 mt-2">
          💡 You need {(target - current).toFixed(1)} more {unit}
        </p>
      )}
    </div>
  );
};

export default MacroCard;