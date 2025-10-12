import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Copy } from 'lucide-react';
import { MealPlan } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MealPlanDetailsDialog from './MealPlanDetailsDialog';

interface MealPlanCardProps {
  mealPlan: MealPlan;
}

export default function MealPlanCard({ mealPlan }: MealPlanCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Format the creation date
  const createdAt = new Date(mealPlan.createdAt);
  const formattedDate = `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Function to copy the meal plan to clipboard
  const copyToClipboard = () => {
    const mealPlanText = `
    ${mealPlan.name}
    ${mealPlan.description}
    
    Daily Nutritional Totals:
    - Calories: ${mealPlan.dailyCalories} cal
    - Protein: ${mealPlan.dailyProtein}g
    - Carbs: ${mealPlan.dailyCarbs}g
    - Fat: ${mealPlan.dailyFat}g
    
    Created on: ${formattedDate}
    `;

    navigator.clipboard.writeText(mealPlanText).then(() => {
      toast({
        title: 'Copied to Clipboard',
        description: 'Meal plan summary has been copied to your clipboard.',
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy meal plan to clipboard.',
        variant: 'destructive',
      });
    });
  };

  return (
    <>
      <Card className={`overflow-hidden border-0 bg-white shadow-sm rounded-2xl transition-all duration-300 ${isExpanded ? 'shadow-md' : ''}`}>
        <div className="relative h-24 bg-gradient-to-tr from-green-500 to-blue-500 overflow-hidden">
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-3/4 opacity-10"></div>
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-white rounded-full translate-x-1/4 translate-y-1/3 opacity-10"></div>
          
          <div className="relative z-10 p-4 flex justify-between h-full items-start">
            <div>
              <h2 className="text-white text-lg font-bold">{mealPlan.name}</h2>
              <div className="flex items-center text-xs text-blue-100 mt-1 gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </div>
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 text-white text-sm">
              <span>{mealPlan.dailyCalories} cal</span>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className={`space-y-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
            <p className="text-sm text-gray-600">{mealPlan.description}</p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center space-y-1">
                <p className="text-xs font-medium text-gray-500">Protein</p>
                <p className="font-semibold text-lg text-green-600">{mealPlan.dailyProtein}<span className="text-xs font-normal">g</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center space-y-1">
                <p className="text-xs font-medium text-gray-500">Carbs</p>
                <p className="font-semibold text-lg text-purple-600">{mealPlan.dailyCarbs}<span className="text-xs font-normal">g</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center space-y-1">
                <p className="text-xs font-medium text-gray-500">Fat</p>
                <p className="font-semibold text-lg text-amber-600">{mealPlan.dailyFat}<span className="text-xs font-normal">g</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center space-y-1">
                <p className="text-xs font-medium text-gray-500">Total</p>
                <p className="font-semibold text-lg text-purple-600">{mealPlan.dailyCalories}<span className="text-xs font-normal"> cal</span></p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 pb-5 pt-0 px-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center gap-1 rounded-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>More</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center gap-1 rounded-full"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 text-white"
            onClick={() => setIsOpen(true)}
          >
            <span>View All</span>
          </Button>
        </CardFooter>
      </Card>

      <MealPlanDetailsDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        mealPlanId={mealPlan.id}
      />
    </>
  );
}