import { useQuery } from '@tanstack/react-query';
import { Loader2, X, Clock, Scale, Utensils, Flame, Salad, Coffee, ChefHat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface MealPlanDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlanId: number;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Mapping for meal type icons
const mealTypeIcons = {
  breakfast: <Coffee className="h-5 w-5 text-orange-500" />,
  lunch: <Salad className="h-5 w-5 text-green-500" />,
  dinner: <ChefHat className="h-5 w-5 text-purple-500" />,
  snack: <Utensils className="h-5 w-5 text-purple-500" />,
};

export default function MealPlanDetailsDialog({
  open,
  onOpenChange,
  mealPlanId,
}: MealPlanDetailsDialogProps) {
  const { data: mealPlan, isLoading, isError } = useQuery({
    queryKey: [`/api/meal-plans/${mealPlanId}`],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plans/${mealPlanId}`);
      if (!res.ok) throw new Error('Failed to fetch meal plan details');
      return res.json();
    },
    enabled: open, // Only fetch when dialog is open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {isLoading ? 'Loading meal plan...' : mealPlan?.name}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                {isLoading ? 'Please wait...' : mealPlan?.description}
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Failed to load meal plan</h3>
              <p className="text-muted-foreground mt-2">
                There was an error loading the meal plan details.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nutrition Summary */}
            <div className="grid grid-cols-4 gap-1 px-6 py-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-col items-center justify-center p-2">
                <Flame className="h-5 w-5 text-orange-500 mb-1" />
                <div className="text-lg font-semibold">{mealPlan.dailyCalories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div className="flex flex-col items-center justify-center p-2">
                <div className="text-sm font-medium text-purple-600 mb-1">P</div>
                <div className="text-lg font-semibold">{mealPlan.dailyProtein}g</div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div className="flex flex-col items-center justify-center p-2">
                <div className="text-sm font-medium text-yellow-600 mb-1">C</div>
                <div className="text-lg font-semibold">{mealPlan.dailyCarbs}g</div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="flex flex-col items-center justify-center p-2">
                <div className="text-sm font-medium text-red-600 mb-1">F</div>
                <div className="text-lg font-semibold">{mealPlan.dailyFat}g</div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>

            {/* Meals Tabs */}
            <Tabs defaultValue="breakfast" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-2 justify-start bg-gray-100 dark:bg-gray-900 rounded-full p-1">
                <TabsTrigger value="breakfast" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                  Breakfast
                </TabsTrigger>
                <TabsTrigger value="lunch" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                  Lunch
                </TabsTrigger>
                <TabsTrigger value="dinner" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                  Dinner
                </TabsTrigger>
                <TabsTrigger value="snack" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                  Snack
                </TabsTrigger>
              </TabsList>
              
              {/* Content for each meal type */}
              {(Object.keys(mealTypeIcons) as MealType[]).map((mealType) => (
                <TabsContent key={mealType} value={mealType} className="flex-1 overflow-hidden m-0 mt-0 pt-0 border-none">
                  <ScrollArea className="h-full px-6">
                    {mealPlan.meals?.filter(meal => meal.type === mealType).map((meal, index) => (
                      <Card key={index} className="mb-4 overflow-hidden border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            {mealTypeIcons[meal.type as MealType]}
                            <CardTitle className="text-lg font-semibold">{meal.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{meal.prepTime} min</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Flame className="h-4 w-4" />
                              <span>{meal.calories} cal</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3 space-y-4">
                          {/* Macros */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-lg border bg-purple-50 p-2 text-center dark:bg-blue-950">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Protein</p>
                              <p className="font-semibold text-purple-600 dark:text-blue-400">{meal.protein}g</p>
                            </div>
                            <div className="rounded-lg border bg-yellow-50 p-2 text-center dark:bg-yellow-950">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Carbs</p>
                              <p className="font-semibold text-yellow-600 dark:text-yellow-400">{meal.carbs}g</p>
                            </div>
                            <div className="rounded-lg border bg-red-50 p-2 text-center dark:bg-red-950">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fat</p>
                              <p className="font-semibold text-red-600 dark:text-red-400">{meal.fat}g</p>
                            </div>
                          </div>
                          
                          {/* Ingredients */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Ingredients</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {meal.ingredients.map((ingredient, i) => (
                                <Badge key={i} variant="outline" className="bg-gray-50 dark:bg-gray-900">
                                  {ingredient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Instructions */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Instructions</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {meal.instructions}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}