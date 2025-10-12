import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Apple, Utensils, Plus } from 'lucide-react';

interface NutritionTabProps {
  userId: number;
}

export default function NutritionTabSimple({ userId }: NutritionTabProps) {
  const [nutritionProfile] = useState({
    dietType: "Mediterranean",
    calorieGoal: 2400,
    proteinGoal: 150,
    carbGoal: 200,
    fatGoal: 80,
    allergies: ["Peanuts", "Shellfish"],
    preferences: ["Chicken", "Fish", "Vegetables"],
    excludedFoods: ["Red Meat", "Processed Sugar"]
  });

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
          
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm px-4 transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Plan
          </Button>
        </div>

        {/* Nutrition Profile Section - iOS-style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="bg-purple-100 p-1.5 rounded-full">
              <Apple className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Nutrition Profile</h2>
          </div>
          
          <Card className="overflow-hidden border-0 bg-white shadow-sm rounded-2xl">
            <div className="relative h-32 bg-gradient-to-tr from-purple-500 to-pink-400 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-300 rounded-full -translate-x-1/2 -translate-y-3/4 opacity-20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300 rounded-full -translate-x-1/4 -translate-y-1/2 opacity-20"></div>
              
              <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-white text-xl font-bold">Your Nutrition Profile</h2>
                  <p className="text-purple-100 text-sm">Your dietary preferences and nutritional goals</p>
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
              <div className="pt-2 pb-1 border-t border-gray-100">
                <h3 className="text-xs font-medium text-red-600 mb-3">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {nutritionProfile.allergies.map((allergy, i) => (
                    <span key={i} className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-medium border border-red-100 shadow-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Food Preferences section with iOS-style tags */}
              <div className="pt-2 pb-1 border-t border-gray-100">
                <h3 className="text-xs font-medium text-green-600 mb-3">Food Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {nutritionProfile.preferences.map((pref, i) => (
                    <span key={i} className="bg-green-50 text-green-600 rounded-full px-3 py-1 text-xs font-medium border border-green-100 shadow-sm">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>

              {/* Excluded Foods section with iOS-style tags */}
              <div className="pt-2 pb-1 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-500 mb-3">Excluded Foods</h3>
                <div className="flex flex-wrap gap-2">
                  {nutritionProfile.excludedFoods.map((food, i) => (
                    <span key={i} className="bg-gray-50 text-gray-500 rounded-full px-3 py-1 text-xs font-medium border border-gray-200 shadow-sm">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="rounded-full"
              >
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Meal Plans Section - iOS-style */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="bg-green-100 p-1.5 rounded-full">
              <Utensils className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Meal Plans</h2>
          </div>
          
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
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-sm transition-all duration-200"
              >
                Generate Meal Plan
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}