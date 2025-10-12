import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 40,
  strokeWidth = 3,
  className = '',
  color = 'text-blue-600'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-in-out', color)}
        />
      </svg>
      {/* Percentage text */}
      <span className={cn('absolute text-xs font-semibold', color)}>
        {Math.round(value)}%
      </span>
    </div>
  );
};