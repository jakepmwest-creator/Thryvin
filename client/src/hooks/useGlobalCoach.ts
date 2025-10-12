import { useState, useCallback } from 'react';
import { useActionHistory, Action } from './useActionHistory';

interface CoachResponse {
  response: string;
  coach?: string;
  confidence?: number;
  suggestions?: string[];
}

interface WorkoutAdjustResponse {
  adjustedSets: Array<{
    exerciseId?: number;
    exerciseName: string;
    targetReps?: number;
    targetWeight?: number;
    targetDuration?: number;
    restTime?: number;
    modifications: string[];
    reasoning: string;
  }>;
  totalDuration: number;
  adjustmentSummary: string;
  warnings?: string[];
}

export function useGlobalCoach() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionHistory = useActionHistory();

  const sendChatMessage = useCallback(async (
    message: string,
    context?: {
      coach?: string;
      currentWorkout?: any;
      userProfile?: any;
      conversationHistory?: Array<{
        role: 'user' | 'coach';
        content: string;
        timestamp?: string;
      }>;
    }
  ): Promise<CoachResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result: CoachResponse = await response.json();
      
      // Log chat interaction as action
      actionHistory.addAction({
        type: 'general',
        description: `Chat: "${message.slice(0, 30)}..."`,
        canUndo: false, // Chat messages can't be undone
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [actionHistory]);

  const adjustWorkout = useCallback(async (
    adjustmentType: 'time' | 'equipment' | 'injury' | 'intensity' | 'focus',
    parameters: {
      targetDuration?: number;
      availableEquipment?: string[];
      injuryLimitations?: string[];
      intensityLevel?: 'low' | 'medium' | 'high';
      focusAreas?: string[];
    },
    currentSets: Array<{
      exerciseId?: number;
      exerciseName: string;
      targetReps?: number;
      targetWeight?: number;
      targetDuration?: number;
      restTime?: number;
    }>
  ): Promise<{ result: WorkoutAdjustResponse | null; actionId?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const originalData = { adjustmentType, parameters, currentSets };

      const response = await fetch('/api/ai/workout/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustmentType,
          parameters,
          currentSets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result: WorkoutAdjustResponse = await response.json();
      
      // Log workout adjustment as undoable action
      const actionId = actionHistory.addAction({
        type: 'workout_adjust',
        description: `Adjusted workout for ${adjustmentType}`,
        canUndo: true,
        undoData: result,
        originalData,
      });

      return { result, actionId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Workout adjust error:', err);
      return { result: null };
    } finally {
      setIsLoading(false);
    }
  }, [actionHistory]);

  const performQuickAction = useCallback(async (actionType: string, context?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      switch (actionType) {
        case 'quick_workout':
          // Generate a quick 15-minute workout
          return await sendChatMessage(
            'Give me a quick 15-minute workout I can do right now',
            { ...context, currentWorkout: { duration: 15 } }
          );
          
        case 'daily_tip':
          // Get a daily fitness tip
          return await sendChatMessage(
            'Give me a motivating fitness tip for today',
            context
          );
          
        case 'adjust_time':
          // Quick time adjustment prompt
          return await sendChatMessage(
            'I need to adjust my workout time. What are my options?',
            context
          );
          
        case 'modify_intensity':
          // Intensity adjustment prompt
          return await sendChatMessage(
            'I want to change the intensity of my workout. Help me adjust it.',
            context
          );
          
        case 'suggest_meal':
          // Meal suggestion
          return await sendChatMessage(
            'Suggest a healthy meal based on my current nutrition goals',
            context
          );
          
        default:
          throw new Error(`Unknown quick action: ${actionType}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Quick action error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sendChatMessage]);

  const undoAction = useCallback((actionId: string) => {
    const action = actionHistory.getAction(actionId);
    if (!action || !action.canUndo) return false;

    // Remove the action from history
    actionHistory.removeAction(actionId);
    
    // Log the undo as a new action
    actionHistory.addAction({
      type: 'general',
      description: `Undid: ${action.description}`,
      canUndo: false,
    });

    return true;
  }, [actionHistory]);

  return {
    // State
    isLoading,
    error,
    
    // Action history
    actions: actionHistory.actions,
    undoableActions: actionHistory.undoableActions,
    
    // Methods
    sendChatMessage,
    adjustWorkout,
    performQuickAction,
    undoAction,
    clearError: () => setError(null),
  };
}