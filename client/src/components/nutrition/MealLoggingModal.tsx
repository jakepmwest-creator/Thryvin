import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Mic, MicOff, Search, Plus, 
  Utensils, Coffee, Sunrise, Sun, Moon, Calculator
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface MealLoggingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  selectedDate: Date;
  onMealLogged: () => void;
}

interface MealForm {
  mealName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  notes: string;
}

export default function MealLoggingModal({
  open,
  onOpenChange,
  userId,
  mealType,
  selectedDate,
  onMealLogged
}: MealLoggingModalProps) {
  const [form, setForm] = useState<MealForm>({
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<keyof MealForm | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const res = await apiRequest('POST', `/api/users/${userId}/logged-meals`, mealData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Meal Logged Successfully',
        description: `Your ${mealType} has been recorded.`,
      });
      onMealLogged();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Log Meal',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setForm({
      mealName: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      notes: ''
    });
  };

  // Speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      
      if (currentField) {
        setForm(prev => ({
          ...prev,
          [currentField]: transcript
        }));
      }
      
      setIsListening(false);
      setCurrentField(null);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setCurrentField(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setCurrentField(null);
    };

    if (isListening && currentField) {
      recognition.start();
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isListening, currentField]);

  const handleVoiceInput = (field: keyof MealForm) => {
    setCurrentField(field);
    setIsListening(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.mealName.trim() || !form.calories.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least meal name and calories.',
        variant: 'destructive',
      });
      return;
    }

    const mealData = {
      mealName: form.mealName.trim(),
      mealType,
      calories: parseInt(form.calories) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
      notes: form.notes.trim(),
      loggedDate: format(selectedDate, 'yyyy-MM-dd')
    };

    logMealMutation.mutate(mealData);
  };

  const getMealTypeIcon = () => {
    switch (mealType) {
      case 'breakfast': return <Sunrise className="w-5 h-5" />;
      case 'lunch': return <Sun className="w-5 h-5" />;
      case 'dinner': return <Moon className="w-5 h-5" />;
      case 'snack': return <Coffee className="w-5 h-5" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  const getMealTypeColor = () => {
    switch (mealType) {
      case 'breakfast': return 'from-orange-400 to-yellow-400';
      case 'lunch': return 'from-blue-400 to-cyan-400';
      case 'dinner': return 'from-purple-400 to-indigo-400';
      case 'snack': return 'from-green-400 to-emerald-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  // Common foods database (simplified version)
  const commonFoods = [
    { name: 'Greek Yogurt (1 cup)', calories: 130, protein: 20, carbs: 9, fat: 0 },
    { name: 'Banana (1 medium)', calories: 105, protein: 1, carbs: 27, fat: 0 },
    { name: 'Chicken Breast (4oz)', calories: 185, protein: 35, carbs: 0, fat: 4 },
    { name: 'Brown Rice (1 cup)', calories: 218, protein: 5, carbs: 45, fat: 2 },
    { name: 'Almonds (1 oz)', calories: 164, protein: 6, carbs: 6, fat: 14 },
    { name: 'Avocado (1 medium)', calories: 322, protein: 4, carbs: 17, fat: 30 },
  ];

  const handleQuickAdd = (food: any) => {
    setForm({
      mealName: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0 rounded-2xl border-0 max-h-[90vh] overflow-hidden">
        <div className="max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getMealTypeColor()} p-6 text-white`}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    {getMealTypeIcon()}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold capitalize">
                      Log {mealType}
                    </DialogTitle>
                    <p className="text-sm opacity-90">
                      {format(selectedDate, 'EEEE, MMM d')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-white hover:bg-white/20 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>
          </div>

          {/* Quick Add Section */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Quick Add</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto scrollbar-hide">
              {commonFoods.slice(0, 3).map((food, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAdd(food)}
                  className="text-left p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{food.name}</span>
                    <span className="text-xs text-gray-500">{food.calories} cal</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Meal Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Meal Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Meal Name *</Label>
              <div className="relative">
                <Input
                  value={form.mealName}
                  onChange={(e) => setForm(prev => ({ ...prev, mealName: e.target.value }))}
                  placeholder="e.g., Grilled chicken salad"
                  className="rounded-xl pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVoiceInput('mealName')}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-lg ${
                    isListening && currentField === 'mealName' 
                      ? 'text-red-500 bg-red-50' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {isListening && currentField === 'mealName' ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Nutrition Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Calories *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm(prev => ({ ...prev, calories: e.target.value }))}
                    placeholder="0"
                    className="rounded-xl pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVoiceInput('calories')}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-lg ${
                      isListening && currentField === 'calories' 
                        ? 'text-red-500 bg-red-50' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isListening && currentField === 'calories' ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Protein (g)</Label>
                <Input
                  type="number"
                  value={form.protein}
                  onChange={(e) => setForm(prev => ({ ...prev, protein: e.target.value }))}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Carbs (g)</Label>
                <Input
                  type="number"
                  value={form.carbs}
                  onChange={(e) => setForm(prev => ({ ...prev, carbs: e.target.value }))}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Fat (g)</Label>
                <Input
                  type="number"
                  value={form.fat}
                  onChange={(e) => setForm(prev => ({ ...prev, fat: e.target.value }))}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this meal..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={logMealMutation.isPending}
                className={`flex-1 rounded-xl bg-gradient-to-r ${getMealTypeColor()} text-white`}
              >
                {logMealMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Logging...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Log Meal
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}