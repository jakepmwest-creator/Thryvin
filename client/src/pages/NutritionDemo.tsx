import React from 'react';
import { NutritionQuickSetup } from '@/components/nutrition/NutritionQuickSetup';
import { useToast } from '@/hooks/use-toast';

export function NutritionDemo() {
  const { toast } = useToast();

  const handleComplete = (data: any) => {
    console.log('Demo completed with data:', data);
    toast({
      title: "Demo Complete!",
      description: "Beautiful setup flow finished successfully",
    });
  };

  const handleSkip = () => {
    console.log('Demo skipped');
    toast({
      title: "Demo Skipped",
      description: "You skipped the beautiful setup flow",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <NutritionQuickSetup
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </div>
    </div>
  );
}