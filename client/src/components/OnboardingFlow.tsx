import { useState } from "react";
import { motion } from "framer-motion";
// Comment out context for now
// import { useUser } from "@/context/UserContext";
import TrainingOption from "./ui/training-option";
import CoachCard from "./ui/coach-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Define types for our onboarding data
type TrainingType = "calisthenics" | "strength" | "wellness";
type Goal = "strength" | "weight" | "health" | "skills";
type CoachingStyle = "supportive" | "direct" | "analytical";
type CoachType = "kai" | "titan" | "lumi";

// Define steps in our onboarding flow
const STEPS = {
  TRAINING_TYPE: 0,
  GOAL: 1,
  COACHING_STYLE: 2,
  COACH_SELECTION: 3,
};

const OnboardingFlow = () => {
  // Create a mock saveUser function instead of using context
  const saveUser = async (userData: any) => {
    console.log("Mock saving user", userData);
    return userData;
  };
  
  // Get toast notification handler
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(STEPS.TRAINING_TYPE);
  const [progressWidth, setProgressWidth] = useState("33%");
  
  // Form state
  const [trainingType, setTrainingType] = useState<TrainingType | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachType | null>(null);
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleNextStep = () => {
    if (currentStep === STEPS.TRAINING_TYPE && trainingType) {
      setCurrentStep(STEPS.GOAL);
      setProgressWidth("66%");
    } else if (currentStep === STEPS.GOAL && goal) {
      setCurrentStep(STEPS.COACHING_STYLE);
      setProgressWidth("100%");
    } else if (currentStep === STEPS.COACHING_STYLE && coachingStyle) {
      setCurrentStep(STEPS.COACH_SELECTION);
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep === STEPS.GOAL) {
      setCurrentStep(STEPS.TRAINING_TYPE);
      setProgressWidth("33%");
    } else if (currentStep === STEPS.COACHING_STYLE) {
      setCurrentStep(STEPS.GOAL);
      setProgressWidth("66%");
    } else if (currentStep === STEPS.COACH_SELECTION) {
      setCurrentStep(STEPS.COACHING_STYLE);
      setProgressWidth("100%");
    }
  };
  
  const handleComplete = async () => {
    if (!trainingType || !goal || !coachingStyle || !selectedCoach) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the new user
      await saveUser({
        username: `user_${Date.now()}`, // Generate a temporary username
        password: `pass_${Date.now()}`, // Generate a temporary password
        trainingType,
        goal,
        coachingStyle,
        selectedCoach,
      });
      
      toast({
        title: "Welcome to FitVerse AI!",
        description: `You've been matched with ${selectedCoach.charAt(0).toUpperCase() + selectedCoach.slice(1)}. Let's start your fitness journey!`,
      });
    } catch (error) {
      console.error("Error during onboarding:", error);
      toast({
        title: "Oops!",
        description: "Something went wrong during onboarding. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-white overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 relative">
        <motion.div 
          className="h-full bg-primary transition-all duration-500" 
          initial={{ width: "33%" }}
          animate={{ width: progressWidth }}
        />
      </div>

      <div className="flex overflow-hidden h-full">
        {/* Question 1: Training Type */}
        <motion.div
          className="onboarding-slide flex-shrink-0 w-full h-full px-6 py-8 flex flex-col"
          initial={{ x: 0 }}
          animate={{ x: currentStep >= STEPS.TRAINING_TYPE ? "-100%" : "0%" }}
        >
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">What's your training style?</h1>
            <p className="text-gray-600 mb-8">This helps us match you with the right coach.</p>
            
            <div className="space-y-4">
              <TrainingOption
                title="Calisthenics & Bodyweight"
                description="Minimal equipment, high mobility"
                icon="fa-running"
                colorClass="coach-kai"
                isSelected={trainingType === "calisthenics"}
                onSelect={() => setTrainingType("calisthenics")}
              />
              
              <TrainingOption
                title="Strength & Power"
                description="Weights, resistance, muscle building"
                icon="fa-dumbbell"
                colorClass="coach-titan"
                isSelected={trainingType === "strength"}
                onSelect={() => setTrainingType("strength")}
              />
              
              <TrainingOption
                title="Wellness & Mobility"
                description="Yoga, stretching, balance"
                icon="fa-wind"
                colorClass="coach-lumi"
                isSelected={trainingType === "wellness"}
                onSelect={() => setTrainingType("wellness")}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleNextStep}
              disabled={!trainingType}
              className={`px-8 py-6 rounded-full ${!trainingType ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </Button>
          </div>
        </motion.div>
        
        {/* Question 2: Goals */}
        <motion.div
          className="onboarding-slide flex-shrink-0 w-full h-full px-6 py-8 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: currentStep === STEPS.GOAL ? "0%" : currentStep < STEPS.GOAL ? "100%" : "-100%" }}
        >
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">What's your main goal?</h1>
            <p className="text-gray-600 mb-8">Let's focus on what matters to you.</p>
            
            <div className="space-y-4">
              <TrainingOption
                title="Build Strength"
                description="Increase power and muscle tone"
                icon="fa-fire-alt"
                colorClass="primary"
                isSelected={goal === "strength"}
                onSelect={() => setGoal("strength")}
              />
              
              <TrainingOption
                title="Lose Weight"
                description="Burn fat and improve fitness"
                icon="fa-weight"
                colorClass="primary"
                isSelected={goal === "weight"}
                onSelect={() => setGoal("weight")}
              />
              
              <TrainingOption
                title="Improve Health"
                description="Better energy and wellbeing"
                icon="fa-heart"
                colorClass="primary"
                isSelected={goal === "health"}
                onSelect={() => setGoal("health")}
              />
              
              <TrainingOption
                title="Learn New Skills"
                description="Master specific movements"
                icon="fa-trophy"
                colorClass="primary"
                isSelected={goal === "skills"}
                onSelect={() => setGoal("skills")}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={handlePreviousStep}
              className="text-gray-600 px-8 py-6 rounded-full"
            >
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={!goal}
              className={`px-8 py-6 rounded-full ${!goal ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </Button>
          </div>
        </motion.div>
        
        {/* Question 3: Coaching Style */}
        <motion.div
          className="onboarding-slide flex-shrink-0 w-full h-full px-6 py-8 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: currentStep === STEPS.COACHING_STYLE ? "0%" : currentStep < STEPS.COACHING_STYLE ? "100%" : "-100%" }}
        >
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">What coaching style motivates you?</h1>
            <p className="text-gray-600 mb-8">We'll adjust your coach's approach.</p>
            
            <div className="space-y-4">
              <TrainingOption
                title="Supportive & Encouraging"
                description="Positive reinforcement"
                icon="fa-hands-helping"
                colorClass="primary"
                isSelected={coachingStyle === "supportive"}
                onSelect={() => setCoachingStyle("supportive")}
              />
              
              <TrainingOption
                title="Direct & Challenging"
                description="Push your limits"
                icon="fa-bullhorn"
                colorClass="primary"
                isSelected={coachingStyle === "direct"}
                onSelect={() => setCoachingStyle("direct")}
              />
              
              <TrainingOption
                title="Analytical & Detailed"
                description="Focus on technique and data"
                icon="fa-chart-line"
                colorClass="primary"
                isSelected={coachingStyle === "analytical"}
                onSelect={() => setCoachingStyle("analytical")}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={handlePreviousStep}
              className="text-gray-600 px-8 py-6 rounded-full"
            >
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={!coachingStyle}
              className={`px-8 py-6 rounded-full ${!coachingStyle ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Find My Coaches
            </Button>
          </div>
        </motion.div>
        
        {/* Coach Selection */}
        <motion.div
          className="onboarding-slide flex-shrink-0 w-full h-full px-6 py-8 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: currentStep === STEPS.COACH_SELECTION ? "0%" : "100%" }}
        >
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Choose your AI Coach</h1>
            <p className="text-gray-600 mb-8">Based on your preferences, here are your perfect matches.</p>
            
            <div className="space-y-6">
              <CoachCard
                name="Kai"
                role="Calisthenics Expert"
                description="Let's master your bodyweight. I'll help you build strength, agility, and control without equipment."
                icon="fa-running"
                colorClass="coach-kai"
                rating={4.7}
                members="10.2k"
                isSelected={selectedCoach === "kai"}
                onSelect={() => setSelectedCoach("kai")}
              />
              
              <CoachCard
                name="Titan"
                role="Strength Coach"
                description="Ready to get strong? I'll guide you through structured weight training for optimal gains and power."
                icon="fa-dumbbell"
                colorClass="coach-titan"
                rating={4.9}
                members="15.8k"
                isSelected={selectedCoach === "titan"}
                onSelect={() => setSelectedCoach("titan")}
              />
              
              <CoachCard
                name="Lumi"
                role="Wellness Guide"
                description="Balance is key. I'll help you improve flexibility, mindfulness, and overall wellness through holistic practices."
                icon="fa-wind"
                colorClass="coach-lumi"
                rating={4.5}
                members="8.7k"
                isSelected={selectedCoach === "lumi"}
                onSelect={() => setSelectedCoach("lumi")}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={handlePreviousStep}
              className="text-gray-600 px-8 py-6 rounded-full"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!selectedCoach || isSubmitting}
              className={`px-8 py-6 rounded-full ${(!selectedCoach || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? "Starting..." : "Start My Journey"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
