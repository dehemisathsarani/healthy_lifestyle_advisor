import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  label: string;
  color?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  label,
  color = 'blue',
  showPercentage = true,
  showValues = true,
  unit = '',
  size = 'md'
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isExceeded = current > target;
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const getColorClass = () => {
    if (isExceeded) return 'bg-red-500';
    if (percentage < 30) return 'bg-red-400';
    if (percentage < 70) return 'bg-yellow-400';
    return `bg-${color}-500`;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showValues && (
          <span className={`text-sm ${isExceeded ? 'text-red-600' : 'text-gray-600'}`}>
            {current.toFixed(1)} / {target.toFixed(1)} {unit}
            {showPercentage && (
              <span className="ml-1 text-xs text-gray-500">
                ({percentage.toFixed(0)}%)
              </span>
            )}
          </span>
        )}
      </div>
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isExceeded && (
        <div className="flex items-center mt-1">
          <span className="text-xs text-red-500">
            ⚠️ Over target by {(current - target).toFixed(1)} {unit}
          </span>
        </div>
      )}
      
      {percentage < 50 && !isExceeded && (
        <div className="flex items-center mt-1">
          <span className="text-xs text-orange-500">
            💡 {(target - current).toFixed(1)} {unit} remaining
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;