import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { NutritionProfile } from '@shared/schema';
import { NutritionQuickSetup } from './NutritionQuickSetup';

interface GenerateMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionProfile: NutritionProfile;
  userId: number;
}

export default function GenerateMealPlanDialog({
  open,
  onOpenChange,
  nutritionProfile,
  userId,
}: GenerateMealPlanDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMealPlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/users/${userId}/generate-meal-plan`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Meal Plan Generated',
        description: 'Your personalized meal plan has been created!',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/meal-plans`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Generate Meal Plan',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle profile edit completion
  const handleEditComplete = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/nutrition-profile`] });
  };

  // Handle generate button click
  const handleGenerate = () => {
    generateMealPlanMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? 'Edit Nutrition Profile' : 'Generate AI Meal Plan'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your nutrition profile before generating a meal plan' 
              : 'Get a personalized meal plan based on your nutrition profile'}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          // Show form to edit nutrition profile
          <div className="py-4">
            <NutritionQuickSetup 
              onComplete={(data) => {
                console.log('Nutrition profile updated:', data);
                handleEditComplete();
              }}
              onSkip={() => {
                handleEditComplete();
              }}
            />
          </div>
        ) : (
          // Show profile summary and generation options
          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Nutrition Profile</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                  <h4 className="font-medium mb-2">Diet Type</h4>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{nutritionProfile.dietType}</p>
                </div>
                
                <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                  <h4 className="font-medium mb-2">Calorie Goal</h4>
                  <p className="text-gray-600 dark:text-gray-400">{nutritionProfile.calorieGoal} calories/day</p>
                </div>
                
                <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                  <h4 className="font-medium mb-2">Macronutrients</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Protein: {nutritionProfile.proteinGoal}g<br />
                    Carbs: {nutritionProfile.carbGoal}g<br />
                    Fat: {nutritionProfile.fatGoal}g
                  </p>
                </div>
              </div>
              
              {nutritionProfile.allergies && nutritionProfile.allergies.length > 0 && (
                <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-900/20">
                  <h4 className="font-medium mb-2">Allergies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {nutritionProfile.allergies.map((allergy, i) => (
                      <span key={i} className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-800/30 dark:text-red-400">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {nutritionProfile.preferences && nutritionProfile.preferences.length > 0 && (
                <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-900/20">
                  <h4 className="font-medium mb-2">Food Preferences</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {nutritionProfile.preferences.map((pref, i) => (
                      <span key={i} className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-800/30 dark:text-green-400">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {nutritionProfile.excludedFoods && nutritionProfile.excludedFoods.length > 0 && (
                <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                  <h4 className="font-medium mb-2">Excluded Foods</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {nutritionProfile.excludedFoods.map((food, i) => (
                      <span key={i} className="inline-block rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Sparkles className="h-4 w-4 text-green-500" />
              <AlertTitle>AI-Generated Meal Plan</AlertTitle>
              <AlertDescription>
                Our AI will create a personalized meal plan with 4 meals (breakfast, lunch, dinner, and snack) 
                based on your nutrition profile. This may take up to 30 seconds.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {generateMealPlanMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {generateMealPlanMutation.error.message || 'Failed to generate meal plan'}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          {isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel Edit
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
          
          {!isEditing && (
            <Button 
              onClick={handleGenerate}
              disabled={generateMealPlanMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl"
            >
              {generateMealPlanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Meal Plan
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}