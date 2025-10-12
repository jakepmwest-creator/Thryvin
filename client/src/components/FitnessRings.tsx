import React from 'react';
import { CircularProgressRing, FitnessRingColors } from './ui/CircularProgressRing';

interface FitnessRingsProps {
  /** Move ring data (calories burned) */
  moveData: {
    current: number;
    goal: number;
  };
  /** Exercise ring data (workout minutes) */
  exerciseData: {
    current: number;
    goal: number;
  };
  /** Stand ring data (hours stood) */
  standData: {
    current: number;
    goal: number;
  };
  /** Optional size for all rings */
  size?: number;
  /** Optional layout orientation */
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export const FitnessRings: React.FC<FitnessRingsProps> = ({
  moveData,
  exerciseData,
  standData,
  size = 120,
  layout = 'horizontal',
}) => {
  // Calculate percentages
  const movePercentage = Math.min((moveData.current / moveData.goal) * 100, 100);
  const exercisePercentage = Math.min((exerciseData.current / exerciseData.goal) * 100, 100);
  const standPercentage = Math.min((standData.current / standData.goal) * 100, 100);

  const layoutClasses = {
    horizontal: 'flex flex-row gap-6 items-center justify-center',
    vertical: 'flex flex-col gap-6 items-center justify-center',
    grid: 'grid grid-cols-1 sm:grid-cols-3 gap-6 place-items-center',
  };

  return (
    <div className={layoutClasses[layout]}>
      <div className="flex flex-col items-center">
        <CircularProgressRing
          color={FitnessRingColors.MOVE}
          percentage={movePercentage}
          label="Move"
          size={size}
          animationDelay={0}
        />
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {moveData.current} / {moveData.goal}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            calories
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <CircularProgressRing
          color={FitnessRingColors.EXERCISE}
          percentage={exercisePercentage}
          label="Exercise"
          size={size}
          animationDelay={0.2}
        />
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {exerciseData.current} / {exerciseData.goal}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            minutes
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <CircularProgressRing
          color={FitnessRingColors.STAND}
          percentage={standPercentage}
          label="Stand"
          size={size}
          animationDelay={0.4}
        />
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {standData.current} / {standData.goal}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            hours
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for smaller spaces
export const CompactFitnessRings: React.FC<FitnessRingsProps> = ({
  moveData,
  exerciseData,
  standData,
}) => {
  const movePercentage = Math.min((moveData.current / moveData.goal) * 100, 100);
  const exercisePercentage = Math.min((exerciseData.current / exerciseData.goal) * 100, 100);
  const standPercentage = Math.min((standData.current / standData.goal) * 100, 100);

  return (
    <div className="flex gap-4 items-center justify-center">
      <CircularProgressRing
        color={FitnessRingColors.MOVE}
        percentage={movePercentage}
        label="Move"
        size={80}
        strokeWidth={6}
        animationDelay={0}
      />
      <CircularProgressRing
        color={FitnessRingColors.EXERCISE}
        percentage={exercisePercentage}
        label="Exercise"
        size={80}
        strokeWidth={6}
        animationDelay={0.1}
      />
      <CircularProgressRing
        color={FitnessRingColors.STAND}
        percentage={standPercentage}
        label="Stand"
        size={80}
        strokeWidth={6}
        animationDelay={0.2}
      />
    </div>
  );
};