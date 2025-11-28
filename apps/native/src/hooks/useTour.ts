import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourStep } from '../components/OnboardingTour';
import { TOUR_STEPS } from '../config/tourSteps';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

export function useTour() {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStep[]>(TOUR_STEPS);
  const elementRefs = useRef<{ [key: string]: any }>({});

  // Check if user has completed tour
  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(TOUR_COMPLETED_KEY);
      if (!completed) {
        // Wait a bit for UI to render, then start tour
        setTimeout(() => {
          setShowTour(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const registerElement = (id: string, ref: any) => {
    elementRefs.current[id] = ref;
  };

  const measureElement = (id: string): Promise<{ x: number; y: number; width: number; height: number } | null> => {
    return new Promise((resolve) => {
      const ref = elementRefs.current[id];
      if (ref && ref.current) {
        ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    });
  };

  const updateStepPosition = async (stepId: string, elementId: string) => {
    const position = await measureElement(elementId);
    if (position) {
      setTourSteps(prev => 
        prev.map(step => 
          step.id === stepId ? { ...step, targetPosition: position } : step
        )
      );
    }
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const skipTour = async () => {
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      setShowTour(false);
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  const completeTour = async () => {
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      setShowTour(false);
    } catch (error) {
      console.error('Error completing tour:', error);
    }
  };

  const resetTour = async () => {
    try {
      await AsyncStorage.removeItem(TOUR_COMPLETED_KEY);
      setCurrentStep(0);
      setShowTour(true);
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  };

  return {
    showTour,
    currentStep,
    tourSteps,
    registerElement,
    updateStepPosition,
    nextStep,
    skipTour,
    completeTour,
    resetTour,
  };
}
