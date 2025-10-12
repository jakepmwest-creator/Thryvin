import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, MessageCircle, Lightbulb, Mic, MicOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';

interface AICoachGuidanceProps {
  userId: number;
  nutritionProfile: any;
  dailyStats: any;
  selectedDate: Date;
}

export default function AICoachGuidance({ 
  userId, 
  nutritionProfile, 
  dailyStats, 
  selectedDate 
}: AICoachGuidanceProps) {
  const [isListening, setIsListening] = useState(false);
  
  // Generate AI guidance based on current progress
  const generateGuidance = () => {
    if (!dailyStats || !nutritionProfile) {
      return {
        message: "Welcome to your nutrition journey! Start by logging your first meal to get personalized guidance.",
        tips: ["Track every meal for accurate insights", "Stay hydrated throughout the day", "Listen to your body's hunger cues"],
        mood: "encouraging"
      };
    }

    const calorieProgress = (dailyStats.calories / nutritionProfile.calorieGoal) * 100;
    const proteinProgress = (dailyStats.protein / nutritionProfile.proteinGoal) * 100;
    
    let message = "";
    let tips = [];
    let mood = "neutral";

    if (calorieProgress < 25) {
      message = isToday(selectedDate) 
        ? "You're just getting started today! Remember to fuel your body with nutritious meals."
        : "Your intake was quite low this day. Make sure to eat enough to support your goals.";
      tips = [
        "Try adding a protein-rich snack",
        "Include healthy fats like nuts or avocado",
        "Don't skip meals - consistency is key"
      ];
      mood = "encouraging";
    } else if (calorieProgress < 70) {
      message = isToday(selectedDate)
        ? "Great progress so far! You're on track to meet your nutrition goals."
        : "You had a balanced approach to nutrition this day. Keep it up!";
      tips = [
        "Focus on completing your remaining meals",
        "Include plenty of vegetables",
        "Stay hydrated with water"
      ];
      mood = "positive";
    } else if (calorieProgress < 100) {
      message = isToday(selectedDate)
        ? "Excellent work! You're very close to hitting your daily targets."
        : "This was a well-balanced nutrition day. Great job staying consistent!";
      tips = [
        "You're doing amazing!",
        "Consider your hunger levels for remaining meals",
        "Celebrate your consistency"
      ];
      mood = "celebrating";
    } else {
      message = isToday(selectedDate)
        ? "You've reached your calorie goal! Focus on nutrient quality for any additional intake."
        : "You met your nutrition goals this day. Excellent commitment to your health!";
      tips = [
        "Focus on hydration now",
        "Choose nutrient-dense options",
        "Listen to your satiety cues"
      ];
      mood = "accomplished";
    }

    if (proteinProgress < 80 && calorieProgress > 50) {
      tips.unshift("Consider adding more protein to reach your goal");
    }

    return { message, tips, mood };
  };

  const guidance = generateGuidance();

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'encouraging': return 'from-blue-400 to-cyan-400';
      case 'positive': return 'from-green-400 to-emerald-400';
      case 'celebrating': return 'from-yellow-400 to-orange-400';
      case 'accomplished': return 'from-purple-400 to-pink-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input functionality would be implemented here
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${getMoodColor(guidance.mood)} p-4 text-white`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Nutrition Coach</h3>
              <p className="text-sm opacity-90">
                {format(selectedDate, isToday(selectedDate) ? "'Today'" : 'MMM d')}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceInput}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
        >
          <p className="text-sm leading-relaxed">{guidance.message}</p>
        </motion.div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Smart Tips</span>
          </div>
          
          {guidance.tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
            </motion.div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4 rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat with Coach
        </Button>
      </CardContent>
    </Card>
  );
}