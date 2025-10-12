import { useState, useCallback } from 'react';

export interface Action {
  id: string;
  type: 'workout_adjust' | 'exercise_swap' | 'nutrition_change' | 'general';
  description: string;
  timestamp: Date;
  canUndo: boolean;
  undoData?: any;
  originalData?: any;
}

export function useActionHistory(maxActions: number = 10) {
  const [actions, setActions] = useState<Action[]>([]);

  const addAction = useCallback((action: Omit<Action, 'id' | 'timestamp'>) => {
    const newAction: Action = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setActions(prev => [newAction, ...prev].slice(0, maxActions));
    return newAction.id;
  }, [maxActions]);

  const removeAction = useCallback((actionId: string) => {
    setActions(prev => prev.filter(action => action.id !== actionId));
  }, []);

  const getAction = useCallback((actionId: string) => {
    return actions.find(action => action.id === actionId);
  }, [actions]);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  const undoableActions = actions.filter(action => action.canUndo);

  return {
    actions,
    undoableActions,
    addAction,
    removeAction,
    getAction,
    clearActions,
  };
}