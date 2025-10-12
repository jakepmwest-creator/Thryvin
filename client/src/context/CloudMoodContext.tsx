import React, { createContext, useContext, ReactNode } from 'react';
import { useCloudMoodSystem, CloudMoodState, CloudMoodEvent } from '../hooks/useCloudMoodSystem';

interface CloudMoodContextType {
  moodState: CloudMoodState;
  moodHistory: CloudMoodEvent[];
  // Action methods
  workoutCompleted: (intensity?: 'low' | 'medium' | 'high') => void;
  goalAchieved: () => void;
  newRecord: () => void;
  streakBroken: () => void;
  userLogin: () => void;
  userInteraction: (intensity?: 'low' | 'medium' | 'high') => void;
  pageNavigation: () => void;
  celebrate: () => void;
  showError: () => void;
  triggerMoodEvent: (event: CloudMoodEvent) => void;
}

const CloudMoodContext = createContext<CloudMoodContextType | undefined>(undefined);

export const CloudMoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const moodSystem = useCloudMoodSystem('calm');

  return (
    <CloudMoodContext.Provider value={moodSystem}>
      {children}
    </CloudMoodContext.Provider>
  );
};

export const useCloudMood = () => {
  const context = useContext(CloudMoodContext);
  if (context === undefined) {
    throw new Error('useCloudMood must be used within a CloudMoodProvider');
  }
  return context;
};