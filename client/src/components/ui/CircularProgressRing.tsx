import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CircularProgressRingProps {
  /** The color of the progress ring (hex, rgb, or CSS color name) */
  color: string;
  /** The percentage value (0-100) */
  percentage: number;
  /** The label text to display below the ring */
  label: string;
  /** Optional size of the ring in pixels (default: 120) */
  size?: number;
  /** Optional stroke width (default: 8) */
  strokeWidth?: number;
  /** Optional animation duration in seconds (default: 1.5) */
  animationDuration?: number;
  /** Optional delay before animation starts in seconds (default: 0) */
  animationDelay?: number;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  color,
  percentage,
  label,
  size = 120,
  strokeWidth = 8,
  animationDuration = 1.5,
  animationDelay = 0,
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate stroke dash offset for the progress
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, animationDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [percentage, animationDelay]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: animationDuration,
              ease: "easeInOut",
              delay: animationDelay,
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        
        {/* Percentage text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: animationDelay + animationDuration * 0.7,
              ease: "easeOut",
            }}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(animatedPercentage)}%
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Label */}
      <motion.div
        className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300 text-center uppercase tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationDelay + animationDuration * 0.8,
          ease: "easeOut",
        }}
      >
        {label}
      </motion.div>
    </div>
  );
};

// Preset colors for common fitness metrics
export const FitnessRingColors = {
  MOVE: '#FF0080', // Pink/Red for Move (calories)
  EXERCISE: '#80FF00', // Green for Exercise (workout minutes)
  STAND: '#00C7FF', // Blue for Stand (hours)
  HEART_RATE: '#FF6B00', // Orange for Heart Rate
  STEPS: '#8E4EC6', // Purple for Steps
  SLEEP: '#1E3A8A', // Dark Blue for Sleep
} as const;

// Example usage component showing all three fitness rings
export const FitnessRingsExample: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-8 items-center justify-center p-8">
      <CircularProgressRing
        color={FitnessRingColors.MOVE}
        percentage={75}
        label="Move"
        animationDelay={0}
      />
      <CircularProgressRing
        color={FitnessRingColors.EXERCISE}
        percentage={60}
        label="Exercise"
        animationDelay={0.2}
      />
      <CircularProgressRing
        color={FitnessRingColors.STAND}
        percentage={90}
        label="Stand"
        animationDelay={0.4}
      />
    </div>
  );
};