import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Apple, Utensils, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import MealPlanCard from './MealPlanCard';
import GenerateMealPlanDialog from './GenerateMealPlanDialog';
import { NutritionQuickSetup } from './NutritionQuickSetup';

interface NutritionTabProps {
  userId: number;
}

export default function NutritionTab({ userId }: NutritionTabProps) {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [showNutritionSetup, setShowNutritionSetup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get nutrition profile
  const { 
    data: nutritionProfile, 
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useQuery({
    queryKey: [`/api/users/${userId}/nutrition-profile`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/nutrition-profile`);
      if (!res.ok) throw new Error('Failed to fetch nutrition profile');
      return res.json();
    }
  });

  // Get meal plans
  const {
    data: mealPlans,
    isLoading: isLoadingMealPlans,
    isError: isMealPlansError,
  } = useQuery({
    queryKey: [`/api/users/${userId}/meal-plans`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/meal-plans`);
      if (!res.ok) throw new Error('Failed to fetch meal plans');
      return res.json();
    },
    enabled: !!nutritionProfile,
  });

  // Handle nutrition quick setup completion
  const handleNutritionSetupComplete = async (setupData: any) => {
    console.log('Nutrition setup data received:', setupData);
    
    try {
      // Convert questionnaire data to nutrition profile with new schema
      const profileData = {
        userId: userId,
        // Core questionnaire data
        goal: setupData.goal, // lose-fat, build-muscle, recomp, eat-healthier
        dietaryPattern: setupData.pattern, // none, vegetarian, vegan, etc.
        dietaryPatternNotes: setupData.patternNotes || '',
        cookingTimePreference: setupData.cookTime, // 5-10-min, 15-25-min, etc.
        
        // Custom lists from questionnaire
        allergiesAndRestrictions: setupData.restrictionsList || [],
        foodDislikes: setupData.dislikesList || [],
        
        // Legacy fields for backward compatibility
        dietType: setupData.pattern === 'vegan' ? 'vegan' : 
                 setupData.pattern === 'vegetarian' ? 'vegetarian' : 
                 setupData.pattern === 'pescatarian' ? 'pescatarian' : 'omnivore',
        calorieGoal: setupData.goal === 'lose-fat' ? 1800 : 
                    setupData.goal === 'build-muscle' ? 2500 : 
                    setupData.goal === 'recomp' ? 2200 : 2000,
        proteinGoal: setupData.goal === 'build-muscle' ? 180 : 
                    setupData.goal === 'recomp' ? 150 : 120,
        carbGoal: setupData.goal === 'lose-fat' ? 150 : 200,
        fatGoal: setupData.goal === 'lose-fat' ? 50 : 65,
        
        // Keep legacy arrays empty (data now in new fields)
        allergies: [],
        preferences: [],
        excludedFoods: []
      };

      console.log('Saving nutrition profile:', profileData);
      await apiRequest('POST', `/api/users/${userId}/nutrition-profile`, profileData);
      
      setShowNutritionSetup(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/nutrition-profile`] });
      
      toast({
        title: 'Nutrition setup complete!',
        description: 'Your personalized nutrition profile has been created',
      });

      // Auto-generate first meal plan
      setTimeout(() => {
        setIsGenerateDialogOpen(true);
      }, 1000);

    } catch (error) {
      console.error('Failed to save nutrition setup:', error);
      toast({
        title: 'Setup failed',
        description: 'Unable to save your nutrition preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Show nutrition setup for new users (no existing profile)
  React.useEffect(() => {
    if (!isLoadingProfile && !nutritionProfile && !showNutritionSetup) {
      console.log('🍎 New user detected - showing Nutrition Quick Setup');
      setShowNutritionSetup(true);
    }
  }, [isLoadingProfile, nutritionProfile, showNutritionSetup]);

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
      setIsGenerateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Generate Meal Plan',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const isLoading = isLoadingProfile || isLoadingMealPlans;
  const isError = isProfileError || isMealPlansError;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Instead of showing an error, treat errors as if the profile doesn't exist yet
  // This will show the nutrition profile form for setup

  return (
    <div className="flex-1 overflow-auto pb-16 bg-gray-50">
      <div className="max-w-xl mx-auto p-4 space-y-4"> 
        {/* Header Section - iOS-style */}
        <div className="flex justify-between items-center pt-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nutrition</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <Apple className="w-4 h-4 text-purple-500 mr-1" />
              Manage your nutrition profile and meal plans
            </p>
          </div>
          
          {nutritionProfile && (
            <Button 
              onClick={() => setIsGenerateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-sm px-4 transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Plan
            </Button>
          )}
        </div>

        {/* Nutrition Profile Section - iOS-style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="bg-purple-100 p-1.5 rounded-full">
              <Apple className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Nutrition Profile</h2>
          </div>
          
          {showNutritionSetup ? (
            <NutritionQuickSetup 
              onComplete={handleNutritionSetupComplete}
              onSkip={() => {
                setShowNutritionSetup(false);
                localStorage.setItem(`nutrition-setup-skipped-${userId}`, 'true');
                toast({
                  title: "Setup skipped",
                  description: "You can access the quick setup anytime from settings",
                });
              }}
            />
          ) : nutritionProfile ? (
            <Card className="overflow-hidden border-0 bg-white shadow-sm rounded-2xl">
              <div className="relative h-32 bg-gradient-to-tr from-blue-500 to-blue-400 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-300 rounded-full -translate-x-1/2 -translate-y-3/4 opacity-20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300 rounded-full -translate-x-1/4 -translate-y-1/2 opacity-20"></div>
                
                <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-white text-xl font-bold">Your Nutrition Profile</h2>
                    <p className="text-blue-100 text-sm">Your dietary preferences and nutritional goals</p>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 flex flex-col items-center text-center">
                    <h3 className="text-xs font-medium text-gray-500">Diet Type</h3>
                    <p className="font-medium text-gray-900">{nutritionProfile.dietType}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 flex flex-col items-center text-center">
                    <h3 className="text-xs font-medium text-gray-500">Calorie Goal</h3>
                    <p className="font-medium text-gray-900">{nutritionProfile.calorieGoal}</p>
                    <span className="text-xs text-purple-500">calories/day</span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 flex flex-col items-center text-center">
                    <h3 className="text-xs font-medium text-gray-500">Macros</h3>
                    <p className="font-medium text-gray-900">
                      P: {nutritionProfile.proteinGoal}g | 
                      C: {nutritionProfile.carbGoal}g | 
                      F: {nutritionProfile.fatGoal}g
                    </p>
                  </div>
                </div>

                {/* Allergies section with iOS-style tags */}
                {nutritionProfile.allergies && nutritionProfile.allergies.length > 0 && (
                  <div className="pt-2 pb-1 border-t border-gray-100">
                    <h3 className="text-xs font-medium text-red-600 mb-3">Allergies</h3>
                    <div className="flex flex-wrap gap-2">
                      {nutritionProfile.allergies.map((allergy: string, i: number) => (
                        <span key={i} className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-medium border border-red-100 shadow-sm">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Food Preferences section with iOS-style tags */}
                {nutritionProfile.preferences && nutritionProfile.preferences.length > 0 && (
                  <div className="pt-2 pb-1 border-t border-gray-100">
                    <h3 className="text-xs font-medium text-green-600 mb-3">Food Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      {nutritionProfile.preferences.map((pref: string, i: number) => (
                        <span key={i} className="bg-green-50 text-green-600 rounded-full px-3 py-1 text-xs font-medium border border-green-100 shadow-sm">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Excluded Foods section with iOS-style tags */}
                {nutritionProfile.excludedFoods && nutritionProfile.excludedFoods.length > 0 && (
                  <div className="pt-2 pb-1 border-t border-gray-100">
                    <h3 className="text-xs font-medium text-gray-500 mb-3">Excluded Foods</h3>
                    <div className="flex flex-wrap gap-2">
                      {nutritionProfile.excludedFoods.map((food: string, i: number) => (
                        <span key={i} className="bg-gray-50 text-gray-500 rounded-full px-3 py-1 text-xs font-medium border border-gray-200 shadow-sm">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsGenerateDialogOpen(true)}
                  className="rounded-full"
                >
                  Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem(`nutrition-setup-skipped-${userId}`);
                    setShowNutritionSetup(true);
                  }}
                  className="rounded-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  Reset nutrition setup
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="overflow-hidden border-0 bg-white shadow-sm rounded-2xl">
              <div className="relative h-32 bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/20 rounded-full -translate-x-1/2 -translate-y-3/4"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/4 -translate-y-1/2"></div>
                
                <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-white text-xl font-bold">Start Your Nutrition Journey</h2>
                    <p className="text-white/90 text-sm">Let's create your personalized meal plan</p>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4 pt-4">
                <p className="text-gray-600 text-center">
                  Complete a quick 5-question setup to get personalized meal recommendations based on your goals, preferences, and lifestyle.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowNutritionSetup(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 py-3 shadow-lg"
                  >
                    🍎 Start Nutrition Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Meal Plans Section - iOS-style */}
        {nutritionProfile && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <div className="bg-green-100 p-1.5 rounded-full">
                <Utensils className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Meal Plans</h2>
            </div>
            
            {mealPlans && mealPlans.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {mealPlans.map((mealPlan: any) => (
                  <MealPlanCard key={mealPlan.id} mealPlan={mealPlan} />
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-0 bg-white shadow-sm rounded-2xl">
                <div className="relative h-32 bg-gradient-to-tr from-green-500 to-green-400 overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-green-300 rounded-full -translate-x-1/2 -translate-y-3/4 opacity-20"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-300 rounded-full -translate-x-1/4 -translate-y-1/2 opacity-20"></div>
                  
                  <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                    <div>
                      <h2 className="text-white text-xl font-bold">No Meal Plans Yet</h2>
                      <p className="text-green-100 text-sm">Generate a personalized meal plan based on your profile</p>
                    </div>
                  </div>
                </div>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 mt-2">
                    <div className="bg-green-50 p-4 rounded-full">
                      <Utensils className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <p className="text-sm text-gray-700">
                        Get AI-powered meal plans customized to your dietary preferences and goals
                      </p>
                      <p className="text-xs text-gray-500">
                        Our AI will generate a complete meal plan including breakfast, lunch, dinner, and snacks that match your nutritional needs.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => generateMealPlanMutation.mutate()}
                    disabled={generateMealPlanMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-sm transition-all duration-200"
                  >
                    {generateMealPlanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Meal Plan'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Generate Meal Plan Dialog */}
      {nutritionProfile && (
        <GenerateMealPlanDialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
          nutritionProfile={nutritionProfile}
          userId={userId}
        />
      )}
    </div>
  );
}