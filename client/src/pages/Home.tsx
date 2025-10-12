import React, { useEffect, useState } from "react";
import MainApp from "../components/MainApp";
import PremiumPreview from "../components/PremiumPreview";
import SubscriptionPlans from "../components/SubscriptionPlans";
import CheckoutPage from "../components/CheckoutPage";
import ProfileSettings from "../components/profile/ProfileSettings";

import { EnhancedOnboarding } from "../components/EnhancedOnboarding";
import { CoachIntroduction } from "../components/CoachIntroduction";
import { SaveProgressPrompt } from "../components/SaveProgressPrompt";
// Using the app's auth provider
import { useAuth } from "@/hooks/use-auth-v2";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { ThryvinLogo } from "../components/ui/ThryvinLogo";
import SplashScreen from "../components/SplashScreen";

// Types for our onboarding data
type FitnessGoal = "lose-weight" | "gain-muscle" | "improve-endurance" | "improve-flexibility" | "general-fitness" | "other";
type UserGender = "male" | "female" | "non-binary" | "prefer-not-to-say";
type FitnessLevel = "beginner" | "intermediate" | "advanced";
type WorkoutType = "strength" | "cardio" | "calisthenics" | "yoga" | "mixed" | "other";
type WeeklyAvailability = "1-2" | "3-4" | "5-6" | "7";
type WorkoutDuration = "less-30" | "30-45" | "45-60" | "more-60";
type Equipment = string[]; // Multiple selection
type MotivationStyle = "supportive" | "challenging" | "tracking" | "community" | "challenges" | "other";
type NutritionPreference = "weight-loss" | "muscle-gain" | "balanced" | "vegetarian" | "yes" | "no" | "not-sure" | "other";
type TrainerStyle = "motivating" | "calm" | "direct" | "friendly" | "other";
type WorkoutTime = "morning" | "afternoon" | "evening";
type CoachingExperience = "first-time" | "online-experience" | "ai-experience";
// Define all the coaches with their specific IDs
type CoachType = 
  // Strength Training Specialists
  | "max-stone" | "alexis-steel" 
  // Cardio and Endurance Specialists
  | "ethan-dash" | "zoey-blaze" 
  // Yoga and Flexibility Specialists
  | "kai-rivers" | "lila-sage" 
  // Calisthenics and Bodyweight Specialists
  | "leo-cruz" | "maya-flex" 
  // Nutrition and Wellness Specialists
  | "nate-green" | "sophie-gold" 
  // General Fitness and Motivation Specialists
  | "dylan-power" | "ava-blaze" 
  // Running & Triathlon Specialists
  | "ryder-swift" | "chloe-fleet";

type OnboardingStep = 
  | "name-collection"
  | "fitness-goal"
  | "user-gender" 
  | "fitness-level" 
  | "workout-type" 
  | "weekly-availability" 
  | "workout-duration"
  | "equipment" 
  | "health-concerns" 
  | "motivation-style" 
  | "nutrition" 
  | "trainer-style"
  | "optional-time"
  | "optional-experience"
  | "coach-selection";

type Screen = 'splash' | 'login' | 'onboarding' | 'coach-intro' | 'save-progress' | 'main' | 'chat' | 'profile' | 'premium-preview' | 'subscription-plans' | 'checkout' | 'profile-settings' | 'logo-design';
// This type is used for string comparisons when navigating
type ScreenString = string;
type MainTab = 'home' | 'chat' | 'profile';
type LoginMethod = 'password' | 'face-id' | 'touch-id';

// Extended Home component with full onboarding
export default function Home() {
  // Use the app's auth provider instead of separate state  
  const { user, isLoading: authLoading, login, register } = useAuth();
  
  const { isSupported, isRegistered, isAuthenticating, autoAuthenticate, register: biometricRegister } = useBiometricAuth();
  
  // Main application state - Always start with splash to ensure smooth transition
  const [screen, setScreen] = useState<Screen>('splash');
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [useEnhancedOnboarding, setUseEnhancedOnboarding] = useState(true);
  
  // Login state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [biometricOption, setBiometricOption] = useState<LoginMethod | null>(null);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState<boolean>(false);
  const [biometricAttempted, setBiometricAttempted] = useState<boolean>(false);
  const [showBiometricSetupModal, setShowBiometricSetupModal] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('');
  const [sendingResetEmail, setSendingResetEmail] = useState<boolean>(false);

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("name-collection");
  
  // Payment flow state
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  
  // Form data state
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | null>(null);
  const [userGender, setUserGender] = useState<UserGender | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<WorkoutDuration | null>(null);
  const [equipment, setEquipment] = useState<Equipment>([]);
  const [healthConcerns, setHealthConcerns] = useState<string | null>(null);
  const [hasHealthConcerns, setHasHealthConcerns] = useState<boolean>(false);
  const [motivationStyle, setMotivationStyle] = useState<MotivationStyle | null>(null);
  const [nutritionPreference, setNutritionPreference] = useState<NutritionPreference | null>(null);
  const [trainerStyle, setTrainerStyle] = useState<TrainerStyle | null>(null);
  const [workoutTime, setWorkoutTime] = useState<WorkoutTime | null>(null);
  const [coachingExperience, setCoachingExperience] = useState<CoachingExperience | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachType | null>(null);
  
  // Other custom inputs
  const [otherFitnessGoal, setOtherFitnessGoal] = useState<string>("");
  const [otherWorkoutType, setOtherWorkoutType] = useState<string>("");
  const [otherEquipment, setOtherEquipment] = useState<string>("");
  const [otherMotivationStyle, setOtherMotivationStyle] = useState<string>("");
  const [otherTrainerStyle, setOtherTrainerStyle] = useState<string>("");
  const [name, setName] = useState<string>("");

  // Auth status is handled by SimpleAuthProvider now - no need for separate check
  const [showBiometricDialog, setShowBiometricDialog] = useState<boolean>(false);
  const [biometricMethod, setBiometricMethod] = useState<LoginMethod | null>(null);
  
  // Listen for GSAP splash completion and handle authentication
  useEffect(() => {
    // Only set up listener if we're still showing splash
    if (screen === 'splash') {
      const handleSplashComplete = () => {
        console.log('GSAP splash completed, transitioning to app');
        // Check if user is authenticated after GSAP splash completes
        if (user && !authLoading) {
          setScreen('main');
        } else {
          setScreen('login');
        }
      };

      // Check if splash element still exists
      const splashElement = document.getElementById('splash');
      if (!splashElement) {
        // Splash already completed before React mounted
        console.log('Splash already completed, transitioning immediately');
        handleSplashComplete();
        return;
      }

      // Listen for the custom splash completion event
      window.addEventListener('splashComplete', handleSplashComplete);
      
      // Fallback timeout in case splash doesn't complete (increased to 3s)
      const fallbackTimer = setTimeout(() => {
        console.log('Splash fallback timer triggered');
        handleSplashComplete();
      }, 3000);
      
      return () => {
        window.removeEventListener('splashComplete', handleSplashComplete);
        clearTimeout(fallbackTimer);
      };
    }
  }, [screen, user, authLoading]);

  // Auto-redirect to main app if user is already logged in (for page refresh)
  useEffect(() => {
    if (user && screen === 'login') {
      console.log('User already logged in, redirecting to main app');
      setScreen('main');
    }
  }, [user, screen]);
  
  // Get progress width based on current onboarding step (1/15 steps)
  const getProgressWidth = () => {
    const steps: OnboardingStep[] = [
      "name-collection",
      "fitness-goal",
      "user-gender", 
      "fitness-level", 
      "workout-type", 
      "weekly-availability", 
      "workout-duration",
      "equipment", 
      "health-concerns", 
      "motivation-style", 
      "nutrition", 
      "trainer-style",
      "optional-time",
      "optional-experience",
      "coach-selection"
    ];
    
    const currentIndex = steps.indexOf(onboardingStep);
    
    if (currentIndex === -1) return "w-0";
    
    // For 13 steps, each step represents approximately 7.7% of the total
    const percentage = Math.round(((currentIndex + 1) / steps.length) * 100);
    return `w-[${percentage}%]`;
  };
  
  // Match user with the appropriate coach based on their answers
  const findMatchingCoach = (): CoachType => {
    // Create a scoring system for each coach based on the user's answers
    let coachScores: Record<CoachType, number> = {
      // Strength Training Specialists
      "max-stone": 0,
      "alexis-steel": 0,
      // Cardio and Endurance Specialists
      "ethan-dash": 0,
      "zoey-blaze": 0,
      // Yoga and Flexibility Specialists
      "kai-rivers": 0,
      "lila-sage": 0,
      // Calisthenics and Bodyweight Specialists
      "leo-cruz": 0,
      "maya-flex": 0,
      // Nutrition and Wellness Specialists
      "nate-green": 0,
      "sophie-gold": 0,
      // General Fitness and Motivation Specialists
      "dylan-power": 0,
      "ava-blaze": 0,
      // Running & Triathlon Specialists
      "ryder-swift": 0,
      "chloe-fleet": 0,
    };
    
    // Coach gender information - this is crucial for gender-based matching
    const maleCoaches: CoachType[] = ["max-stone", "ethan-dash", "kai-rivers", "leo-cruz", "nate-green", "dylan-power", "ryder-swift"];
    const femaleCoaches: CoachType[] = ["alexis-steel", "zoey-blaze", "lila-sage", "maya-flex", "sophie-gold", "ava-blaze", "chloe-fleet"];
    
    // Add a significant gender matching score bonus
    if (userGender === "male") {
      // Male users get male coaches with a strong preference
      maleCoaches.forEach(coach => {
        coachScores[coach] += 10;
      });
    } else if (userGender === "female") {
      // Female users get female coaches with a strong preference
      femaleCoaches.forEach(coach => {
        coachScores[coach] += 10;
      });
    }
    // Non-binary and prefer-not-to-say users will be matched based on other criteria
    
    // 1. Score based on fitness goal
    if (fitnessGoal === "gain-muscle") {
      // Strength trainers get highest preference for muscle gain
      coachScores["max-stone"] += 8;
      coachScores["alexis-steel"] += 8;
      // Calisthenics coaches are also relevant for muscle gain
      coachScores["leo-cruz"] += 5;
      coachScores["maya-flex"] += 5;
    } else if (fitnessGoal === "lose-weight") {
      // Cardio specialists for weight loss
      coachScores["zoey-blaze"] += 8;
      coachScores["ethan-dash"] += 8;
      // HIIT specialists
      coachScores["ava-blaze"] += 7;
      // Running specialists
      coachScores["ryder-swift"] += 6;
      coachScores["chloe-fleet"] += 6;
      // Nutrition specialists are key for weight loss
      coachScores["sophie-gold"] += 9;
      coachScores["nate-green"] += 8;
    } else if (fitnessGoal === "improve-endurance") {
      // Cardio and running specialists are best for endurance
      coachScores["ethan-dash"] += 8;
      coachScores["zoey-blaze"] += 7;
      coachScores["ryder-swift"] += 10; // Top endurance coach
      coachScores["chloe-fleet"] += 9;
    } else if (fitnessGoal === "improve-flexibility") {
      // Yoga specialists are best for flexibility
      coachScores["kai-rivers"] += 10;
      coachScores["lila-sage"] += 10;
      // Calisthenics can help with flexibility too
      coachScores["leo-cruz"] += 5;
      coachScores["maya-flex"] += 5;
    } else if (fitnessGoal === "general-fitness") {
      // General fitness specialists
      coachScores["dylan-power"] += 10;
      coachScores["ava-blaze"] += 8;
      // Everyone else gets moderate scores for general fitness
      Object.keys(coachScores).forEach(coach => {
        if (coach !== "dylan-power" && coach !== "ava-blaze") {
          coachScores[coach as CoachType] += 4;
        }
      });
    }
    
    // 2. Score based on workout type
    if (workoutType === "strength") {
      // Strength specialists get top preference
      coachScores["max-stone"] += 9;
      coachScores["alexis-steel"] += 9;
      // Calisthenics for bodyweight strength
      coachScores["leo-cruz"] += 6;
      coachScores["maya-flex"] += 6;
    } else if (workoutType === "cardio") {
      // Cardio and running specialists
      coachScores["ethan-dash"] += 9;
      coachScores["zoey-blaze"] += 9;
      coachScores["ryder-swift"] += 8;
      coachScores["chloe-fleet"] += 8;
      // HIIT specialist
      coachScores["ava-blaze"] += 7;
    } else if (workoutType === "calisthenics") {
      // Calisthenics specialists
      coachScores["leo-cruz"] += 10;
      coachScores["maya-flex"] += 10;
      // Yoga specialists have some overlap
      coachScores["kai-rivers"] += 5;
    } else if (workoutType === "yoga") {
      // Yoga and flexibility specialists
      coachScores["kai-rivers"] += 10;
      coachScores["lila-sage"] += 10;
      // Wellness coaches understand yoga
      coachScores["nate-green"] += 6;
      coachScores["sophie-gold"] += 6;
    } else if (workoutType === "mixed") {
      // General fitness coaches are best for mixed
      coachScores["dylan-power"] += 9;
      coachScores["ava-blaze"] += 9;
      // Everyone else gets moderate scores for mixed workouts
      Object.keys(coachScores).forEach(coach => {
        if (coach !== "dylan-power" && coach !== "ava-blaze") {
          coachScores[coach as CoachType] += 4;
        }
      });
    }
    
    // 3. Consider fitness level
    if (fitnessLevel === "beginner") {
      // More supportive coaches might be better for beginners
      coachScores["lila-sage"] += 4;
      coachScores["maya-flex"] += 4;
      coachScores["dylan-power"] += 4;
      coachScores["sophie-gold"] += 4;
      coachScores["nate-green"] += 3;
      coachScores["kai-rivers"] += 3;
    } else if (fitnessLevel === "intermediate") {
      // Intermediate users get balanced coaches
      coachScores["dylan-power"] += 4;
      coachScores["ava-blaze"] += 4;
      coachScores["maya-flex"] += 3;
      coachScores["leo-cruz"] += 3;
    } else if (fitnessLevel === "advanced") {
      // Advanced users get high-intensity coaches
      coachScores["max-stone"] += 5;
      coachScores["alexis-steel"] += 5;
      coachScores["ava-blaze"] += 4;
      coachScores["ryder-swift"] += 4;
      coachScores["ethan-dash"] += 4;
    }

    // 4. Consider equipment availability
    if (equipment.includes("dumbbells") || equipment.includes("barbells")) {
      // Strength specialists work best with weights
      coachScores["max-stone"] += 4;
      coachScores["alexis-steel"] += 4;
    }
    if (equipment.includes("yoga-mat")) {
      // Yoga specialists benefit from yoga equipment
      coachScores["kai-rivers"] += 3;
      coachScores["lila-sage"] += 3;
    }
    if (equipment.length === 0 || equipment.includes("bodyweight")) {
      // Calisthenics specialists excel with no equipment
      coachScores["leo-cruz"] += 5;
      coachScores["maya-flex"] += 5;
      coachScores["kai-rivers"] += 3;
    }

    // 5. Consider motivation style preferences
    if (motivationStyle && motivationStyle === "supportive") {
      coachScores["lila-sage"] += 4;
      coachScores["sophie-gold"] += 4;
      coachScores["dylan-power"] += 3;
      coachScores["nate-green"] += 3;
    } else if (motivationStyle && motivationStyle === "challenging") {
      coachScores["max-stone"] += 4;
      coachScores["ava-blaze"] += 4;
      coachScores["ryder-swift"] += 3;
      coachScores["ethan-dash"] += 3;
    } else if (motivationStyle && motivationStyle === "tracking") {
      coachScores["dylan-power"] += 4;
      coachScores["ava-blaze"] += 3;
      coachScores["ryder-swift"] += 3;
    }

    // 6. Add some randomization to prevent always getting the same coach
    Object.keys(coachScores).forEach(coach => {
      coachScores[coach as CoachType] += Math.floor(Math.random() * 3);
    });
    
    // Find the coach with the highest score
    let bestCoach: CoachType = "dylan-power"; // Default fallback
    let highestScore = 0;
    
    Object.entries(coachScores).forEach(([coach, score]) => {
      console.log(`Coach ${coach}: ${score} points`); // Debug logging
      if (score > highestScore) {
        highestScore = score;
        bestCoach = coach as CoachType;
      }
    });
    
    console.log(`Selected coach: ${bestCoach} with ${highestScore} points`); // Debug logging
    return bestCoach;
  };

  // Function to handle next step in onboarding
  const handleNextStep = () => {
    switch (onboardingStep) {
      case "name-collection":
        if (name.trim()) setOnboardingStep("fitness-goal");
        break;
      case "fitness-goal":
        if (fitnessGoal) setOnboardingStep("user-gender");
        break;
      case "user-gender":
        if (userGender) setOnboardingStep("fitness-level");
        break;  
      case "fitness-level":
        if (fitnessLevel) setOnboardingStep("workout-type");
        break;
      case "workout-type":
        if (workoutType) setOnboardingStep("weekly-availability");
        break;
      case "weekly-availability":
        if (weeklyAvailability) setOnboardingStep("workout-duration");
        break;
      case "workout-duration":
        if (workoutDuration) setOnboardingStep("equipment");
        break;
      case "equipment":
        // Allow progression even if no equipment is selected (bodyweight workouts)
        setOnboardingStep("health-concerns");
        break;
      case "health-concerns":
        setOnboardingStep("motivation-style");
        break;
      case "motivation-style":
        if (motivationStyle) setOnboardingStep("nutrition");
        break;
      case "nutrition":
        if (nutritionPreference) setOnboardingStep("trainer-style");
        break;
      case "trainer-style":
        if (trainerStyle) setOnboardingStep("optional-time");
        break;
      case "optional-time":
        setOnboardingStep("optional-experience");
        break;
      case "optional-experience":
        // Match the user with the appropriate coach before showing the result
        const matchedCoach = findMatchingCoach();
        setSelectedCoach(matchedCoach);
        setOnboardingStep("coach-selection");
        break;
      case "coach-selection":
        // Complete onboarding by registering the user with all their preferences
        handleCompleteOnboarding();
        break;
    }
  };
  
  // Handle premium flow
  const handleContinueToPayment = () => {
    setScreen('subscription-plans');
  };

  const handleStartFreeTrial = () => {
    setScreen('main');
  };

  const handleSelectPlan = (planId: string, planName: string, price: number, billingPeriod: 'monthly' | 'annually') => {
    setSelectedPlan(planId);
    setSelectedPlanName(planName);
    setPlanPrice(price);
    setBillingPeriod(billingPeriod);
    setScreen('checkout');
  };

  const handleBackFromPlans = () => {
    setScreen('premium-preview');
  };

  const handleCompleteCheckout = () => {
    // In a real app, this would process the payment
    // For now, just proceed to the main app
    setScreen('main');
  };

  const handleBackFromCheckout = () => {
    setScreen('subscription-plans');
  };

  // Authentication is now handled by SimpleAuthProvider

  const handleLogin = async () => {
    if (!email || !password) return;
    
    try {
      await login(email, password);
      // Set default coach if none selected
      if (!selectedCoach) {
        setSelectedCoach("dylan-power");
      }
      // Navigation is handled automatically by the auth system, but we also need to update the screen
      setScreen('main');
    } catch (error) {
      // Error handling is already done in the auth provider
    }
  };

  // Registration function that works exactly like login
  const handleRegistration = async (registrationData: any) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        
        // For NEW users: clear tutorial completed flag and set onboarding flag
        localStorage.removeItem('thryvin-tutorial-completed');
        localStorage.setItem('thryvin-onboarding-just-completed', 'true');
        
        // Save pending onboarding data now that user is registered and logged in
        const pendingData = localStorage.getItem('pendingOnboardingData');
        if (pendingData) {
          try {
            const { data, coach } = JSON.parse(pendingData);
            console.log('Saving pending onboarding data for registered user...');
            await saveOnboardingData(data, coach);
            localStorage.removeItem('pendingOnboardingData'); // Clean up
            console.log('✅ Onboarding data saved successfully after registration!');
            
            // 🗓️ GENERATE MONTHLY CALENDAR IMMEDIATELY AFTER ONBOARDING
            try {
              console.log('🚀 Starting calendar pre-generation...');
              const { CalendarPreGenerationService } = await import('../services/CalendarPreGeneration');
              
              // Create user object from registration data and onboarding data
              const userForCalendar = {
                id: userData.user.id,
                trainingDaysPerWeek: data.trainingDaysPerWeek || 3,
                sessionDurationPreference: data.sessionDurationMin || 45,
                trainingType: registrationData.trainingType || 'mixed',
                goal: registrationData.goal || 'general-fitness',
                fitnessLevel: data.fitnessLevel || 'beginner',
                cardioPreference: 'neutral', // Default value
                preferredTrainingDays: data.preferredTrainingDays ? JSON.stringify(data.preferredTrainingDays) : null,
                focusAreas: data.focusAreas ? JSON.stringify(data.focusAreas) : null,
                avoidanceAreas: data.avoidanceAreas ? JSON.stringify(data.avoidanceAreas) : null,
                preferredTrainingTime: data.preferredTrainingTime || null
              };
              
              await CalendarPreGenerationService.generateMonthlyCalendar(userForCalendar);
              console.log('🎉 Monthly calendar pre-generated successfully!');
              
              // Set flag for immediate calendar availability
              localStorage.setItem('thryvin-calendar-ready', 'true');
              
            } catch (calendarError) {
              console.error('❌ Calendar generation failed:', calendarError);
              // Don't block the registration flow if calendar generation fails
            }
            
          } catch (error) {
            console.error('Failed to save onboarding data after registration:', error);
            // Don't block the flow if this fails
          }
        }
        
        // Success! Go to main app immediately
        setScreen('main');
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Registration failed!');
        return false;
      }
    } catch (error) {
      alert('Network error during registration!');
      return false;
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // User state is now managed by auth provider
      setScreen('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return;
    
    setSendingResetEmail(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Password reset email sent! Check your inbox.');
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
      } else {
        // Handle specific error messages
        const errorMessage = data.error || 'Error sending reset email. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  // Handle biometric login (Face ID or Touch ID)
  const handleBiometricLogin = (method: LoginMethod) => {
    setBiometricMethod(method);
    setShowBiometricDialog(true);
  };

  // Handle biometric confirmation
  const handleBiometricConfirm = () => {
    setShowBiometricDialog(false);
    
    // Simulate biometric authentication with a loading state
    setTimeout(() => {
      // Only allow biometric login if user has previously logged in
      // For demo purposes, we'll check if there's a remembered user
      if (user || rememberMe) {
        if (!selectedCoach) {
          setSelectedCoach("dylan-power");
        }
        setScreen('main');
      } else {
        // Show error - biometric requires previous login
        alert('Please sign in with your account first to enable biometric authentication.');
      }
    }, 1500);
  };

  // Handle complete onboarding with user registration
  const handleCompleteOnboarding = () => {
    if (!name || !email || !password) {
      alert('Please ensure your name, email, and password are filled in.');
      return;
    }

    // Create user account with all onboarding preferences
    const userData = {
      name: name,
      email: email,
      password: password,
      goal: fitnessGoal || 'general-fitness',
      trainingType: workoutType || 'mixed',
      coachingStyle: motivationStyle || 'tracking',
      selectedCoach: selectedCoach,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      fitnessLevel: fitnessLevel || 'beginner',
      weeklyGoalWorkouts: parseInt(weeklyAvailability?.split('-')[0] || '3'),
      weeklyGoalMinutes: parseInt(workoutDuration?.split('-')[0] || '30') * parseInt(weeklyAvailability?.split('-')[0] || '3'),
      equipment: equipment.length > 0 ? equipment.join(',') : 'bodyweight',
      healthConcerns: healthConcerns || '',
      nutritionGoal: nutritionPreference || 'balanced',
      gender: userGender || 'prefer-not-to-say'
    };

    // Ensure selectedCoach is not null before registering
    if (!selectedCoach) {
      setSelectedCoach("dylan-power"); // Set default coach
    }
    
    const finalUserData = {
      ...userData,
      selectedCoach: selectedCoach || "dylan-power"
    };

    // TODO: Implement registration with new auth system
    console.log('Registration not implemented yet:', finalUserData);
    
    // For now, just go to premium preview
    setScreen('premium-preview');
  };

  // Function to save enhanced onboarding data to database
  const saveOnboardingData = async (data: any, selectedCoach: CoachType) => {
    try {
      // Calculate age from dateOfBirth
      const dobDate = new Date(data.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      
      // Format height and weight with units for storage
      let height = '';
      if (data.heightUnit === 'ft') {
        height = `${data.heightFt}'${data.heightIn}"`;
      } else {
        height = `${data.heightCm}cm`;
      }
      
      const weight = `${data.weight}${data.weightUnit}`;
      
      // 1. Update personal information
      const personalInfoResponse = await fetch('/api/user/personal-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.displayName,
          age: age,
          height: height,
          weight: weight,
          fitnessLevel: data.fitnessLevel,
        })
      });
      
      if (!personalInfoResponse.ok) {
        throw new Error('Failed to save personal info');
      }
      
      // 2. Save comprehensive onboarding responses for AI
      const onboardingResponse = await fetch('/api/user/ai-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          responses: [
            {
              stepId: 'enhanced-onboarding',
              response: JSON.stringify(data)
            }
          ]
        })
      });
      
      if (!onboardingResponse.ok) {
        throw new Error('Failed to save onboarding data');
      }
      
      console.log('✅ Onboarding data saved successfully');
      
      // 🗓️ TRIGGER CALENDAR PRE-GENERATION FOR EXISTING USERS
      try {
        console.log('🚀 Starting calendar pre-generation for existing user...');
        const { CalendarPreGenerationService } = await import('../services/CalendarPreGeneration');
        
        // Create user object from authenticated user data and onboarding data
        const userForCalendar = {
          id: user?.id || 1, // Use authenticated user ID
          trainingDaysPerWeek: data.trainingDaysPerWeek || (user as any)?.trainingDaysPerWeek || 3,
          sessionDurationPreference: data.sessionDurationMin || (user as any)?.sessionDurationPreference || 45,
          trainingType: (user as any)?.trainingType || 'mixed',
          goal: (user as any)?.goal || 'general-fitness',
          fitnessLevel: data.fitnessLevel || (user as any)?.fitnessLevel || 'beginner',
          cardioPreference: (user as any)?.cardioPreference || 'neutral',
          preferredTrainingDays: data.preferredTrainingDays ? JSON.stringify(data.preferredTrainingDays) : (user as any)?.preferredTrainingDays,
          focusAreas: data.focusAreas ? JSON.stringify(data.focusAreas) : (user as any)?.focusAreas,
          avoidanceAreas: data.avoidanceAreas ? JSON.stringify(data.avoidanceAreas) : (user as any)?.avoidanceAreas,
          preferredTrainingTime: data.preferredTrainingTime || (user as any)?.preferredTrainingTime
        };
        
        await CalendarPreGenerationService.generateMonthlyCalendar(userForCalendar);
        console.log('🎉 Monthly calendar pre-generated for existing user!');
        localStorage.setItem('thryvin-calendar-ready', 'true');
        
      } catch (calendarError) {
        console.error('❌ Calendar generation failed for existing user:', calendarError);
        // Don't block the flow
      }
      
    } catch (error) {
      console.error('❌ Error saving onboarding data:', error);
      throw error;
    }
  };

  // Function to handle previous step in onboarding
  const handlePreviousStep = () => {
    switch (onboardingStep) {
      case "fitness-goal":
        setOnboardingStep("name-collection");
        break;
      case "user-gender":
        setOnboardingStep("fitness-goal");
        break;
      case "fitness-level":
        setOnboardingStep("user-gender");
        break;
      case "workout-type":
        setOnboardingStep("fitness-level");
        break;
      case "weekly-availability":
        setOnboardingStep("workout-type");
        break;
      case "workout-duration":
        setOnboardingStep("weekly-availability");
        break;
      case "equipment":
        setOnboardingStep("workout-duration");
        break;
      case "health-concerns":
        setOnboardingStep("equipment");
        break;
      case "motivation-style":
        setOnboardingStep("health-concerns");
        break;
      case "nutrition":
        setOnboardingStep("motivation-style");
        break;
      case "trainer-style":
        setOnboardingStep("nutrition");
        break;
      case "optional-time":
        setOnboardingStep("trainer-style");
        break;
      case "optional-experience":
        setOnboardingStep("optional-time");
        break;
      case "coach-selection":
        setOnboardingStep("optional-experience");
        break;
    }
  };
  
  // GSAP splash screen is now handled by splash.js in the HTML
  // We just return null here to let the GSAP splash do its work
  // Removed early return that was causing React hooks order issue
  
  // Show onboarding process
  // Onboarding render function
  const renderOnboarding = () => {
    if (useEnhancedOnboarding) {
      return (
        <EnhancedOnboarding
          onComplete={(data) => {
            console.log("Enhanced onboarding completed with data:", data);
            
            // Set onboarding data from the enhanced onboarding (mapping new structure to old)
            const newFitnessGoal = (data.primaryGoal as FitnessGoal) || 'general-fitness';
            const newUserGender = (data.gender as UserGender) || 'prefer-not-to-say';
            const newFitnessLevel = data.fitnessLevel || 'beginner';
            
            // Map primary goal to workout type for better coach matching
            let newWorkoutType = 'mixed';
            if (data.primaryGoal === 'build-muscle') newWorkoutType = 'strength';
            else if (data.primaryGoal === 'lose-weight') newWorkoutType = 'cardio';
            else if (data.primaryGoal === 'improve-endurance') newWorkoutType = 'cardio';
            else if (data.primaryGoal === 'improve-flexibility') newWorkoutType = 'yoga';
            
            const newWeeklyAvailability = (data.trainingDaysPerWeek?.replace('every-day', '7') as WeeklyAvailability) || '3-4';
            const newWorkoutDuration = (data.sessionDurationMin?.replace('60+', 'more-60') as WorkoutDuration) || '30-45';
            const newEquipment: string[] = []; // Default empty equipment since it's not in new onboarding
            
            // Map coaching style with better variety
            let newMotivationStyle = 'tracking';
            if (data.coachingStyle === 'encouraging-positive') newMotivationStyle = 'supportive';
            else if (data.coachingStyle === 'straightforward-disciplined') newMotivationStyle = 'challenging';
            else if (data.coachingStyle === 'casual-friendly') newMotivationStyle = 'community';
            
            console.log('Mapped data:', {
              goal: newFitnessGoal,
              workoutType: newWorkoutType,
              gender: newUserGender,
              motivationStyle: newMotivationStyle,
              fitnessLevel: newFitnessLevel
            });
            
            // Store the full onboarding data for later use
            setName(data.displayName);
            console.log('New onboarding data structure:', data);
            
            // Set all state variables
            setFitnessGoal(newFitnessGoal);
            setUserGender(newUserGender);
            setFitnessLevel(newFitnessLevel);
            setWorkoutType(newWorkoutType);
            setWeeklyAvailability(newWeeklyAvailability);
            setWorkoutDuration(newWorkoutDuration);
            setEquipment(newEquipment);
            setMotivationStyle(newMotivationStyle);
            
            // Create a local coach matching function that uses the local data instead of state
            const findMatchingCoachWithData = (): CoachType => {
              let coachScores: Record<CoachType, number> = {
                "max-stone": 0, "alexis-steel": 0, "ethan-dash": 0, "zoey-blaze": 0,
                "kai-rivers": 0, "lila-sage": 0, "leo-cruz": 0, "maya-flex": 0,
                "nate-green": 0, "sophie-gold": 0, "dylan-power": 0, "ava-blaze": 0,
                "ryder-swift": 0, "chloe-fleet": 0,
              };
              
              const maleCoaches: CoachType[] = ["max-stone", "ethan-dash", "kai-rivers", "leo-cruz", "nate-green", "dylan-power", "ryder-swift"];
              const femaleCoaches: CoachType[] = ["alexis-steel", "zoey-blaze", "lila-sage", "maya-flex", "sophie-gold", "ava-blaze", "chloe-fleet"];
              
              // Gender matching
              if (newUserGender === "male") {
                maleCoaches.forEach(coach => coachScores[coach] += 10);
              } else if (newUserGender === "female") {
                femaleCoaches.forEach(coach => coachScores[coach] += 10);
              }
              
              // Fitness goal scoring
              if (newFitnessGoal === "gain-muscle") {
                coachScores["max-stone"] += 8;
                coachScores["alexis-steel"] += 8;
                coachScores["leo-cruz"] += 5;
                coachScores["maya-flex"] += 5;
              } else if (newFitnessGoal === "lose-weight") {
                coachScores["zoey-blaze"] += 8;
                coachScores["ethan-dash"] += 8;
                coachScores["ava-blaze"] += 7;
                coachScores["sophie-gold"] += 9;
                coachScores["nate-green"] += 8;
              } else if (newFitnessGoal === "improve-endurance") {
                coachScores["ryder-swift"] += 10;
                coachScores["chloe-fleet"] += 9;
                coachScores["ethan-dash"] += 8;
                coachScores["zoey-blaze"] += 7;
              } else if (newFitnessGoal === "improve-flexibility") {
                coachScores["kai-rivers"] += 10;
                coachScores["lila-sage"] += 10;
              } else if (newFitnessGoal === "general-fitness") {
                coachScores["dylan-power"] += 10;
                coachScores["ava-blaze"] += 8;
              }
              
              // Workout type scoring
              if (newWorkoutType === "strength") {
                coachScores["max-stone"] += 9;
                coachScores["alexis-steel"] += 9;
                coachScores["leo-cruz"] += 6;
                coachScores["maya-flex"] += 6;
              } else if (newWorkoutType === "cardio") {
                coachScores["ethan-dash"] += 9;
                coachScores["zoey-blaze"] += 9;
                coachScores["ryder-swift"] += 8;
                coachScores["chloe-fleet"] += 8;
              } else if (newWorkoutType === "calisthenics") {
                coachScores["leo-cruz"] += 10;
                coachScores["maya-flex"] += 10;
              } else if (newWorkoutType === "yoga") {
                coachScores["kai-rivers"] += 10;
                coachScores["lila-sage"] += 10;
              } else if (newWorkoutType === "mixed") {
                coachScores["dylan-power"] += 9;
                coachScores["ava-blaze"] += 9;
              }
              
              // Fitness level scoring
              if (newFitnessLevel === "beginner") {
                coachScores["lila-sage"] += 4;
                coachScores["maya-flex"] += 4;
                coachScores["dylan-power"] += 4;
                coachScores["sophie-gold"] += 4;
              } else if (newFitnessLevel === "advanced") {
                coachScores["max-stone"] += 5;
                coachScores["alexis-steel"] += 5;
                coachScores["ava-blaze"] += 4;
                coachScores["ryder-swift"] += 4;
              }
              
              // Motivation style scoring for better variety
              if (newMotivationStyle === 'challenging') {
                coachScores["max-stone"] += 6;
                coachScores["alexis-steel"] += 6;
                coachScores["ryder-swift"] += 5;
              } else if (newMotivationStyle === 'supportive') {
                coachScores["lila-sage"] += 6;
                coachScores["maya-flex"] += 6;
                coachScores["sophie-gold"] += 5;
              } else if (newMotivationStyle === 'community') {
                coachScores["dylan-power"] += 6;
                coachScores["ava-blaze"] += 6;
                coachScores["ethan-dash"] += 5;
              }
              
              // Add smaller randomization
              Object.keys(coachScores).forEach(coach => {
                coachScores[coach as CoachType] += Math.floor(Math.random() * 2);
              });
              
              let bestCoach: CoachType = "dylan-power";
              let highestScore = 0;
              
              Object.entries(coachScores).forEach(([coach, score]) => {
                console.log(`Coach ${coach}: ${score} points`);
                if (score > highestScore) {
                  highestScore = score;
                  bestCoach = coach as CoachType;
                }
              });
              
              console.log(`Selected coach: ${bestCoach} with ${highestScore} points`);
              return bestCoach;
            };
            
            // Find and set the matching coach using local data
            const matchedCoach = findMatchingCoachWithData();
            setSelectedCoach(matchedCoach);
            
            // Store onboarding data for later saving after registration
            localStorage.setItem('pendingOnboardingData', JSON.stringify({
              data: data,
              coach: matchedCoach
            }));
            
            // Navigate to coach introduction (data will be saved after registration)
            setScreen('coach-intro');
          }}
          onSkip={() => setScreen('main')}
          onBackToLogin={() => setScreen('login')}
        />
      );
    }

    // Show classic onboarding
    return (
      <div className="min-h-screen bg-white">
        {/* iOS-style status bar */}
        <div className="ios-status-bar px-4 pt-2 pb-1 flex justify-between items-center text-xs text-gray-600">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <i className="fas fa-signal"></i>
            <i className="fas fa-wifi"></i>
            <i className="fas fa-battery-full"></i>
          </div>
        </div>
      
        {/* iOS-style header */}
        <div className="px-4 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-sm">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="ml-3">
              <h2 className="ios-header">FitVerse AI</h2>
              <div className="ios-caption">Personalized fitness journey</div>
            </div>
          </div>
        </div>
        
        {/* Progress bar - iOS style */}
        <div className="mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full bg-purple-500 transition-all duration-500 ${getProgressWidth()}`}></div>
        </div>
        
        {/* 0. Name Collection Step */}
        {onboardingStep === "name-collection" && (
          <div className="p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="ios-header text-xl mb-1">What should we call you?</h1>
            <p className="ios-subheader text-sm mb-4">Your AI coach will use this name to personalize your experience</p>
            
            <div className="mb-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full p-4 border border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
                autoFocus
              />
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setScreen('login')}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!name.trim()}
                className={`px-6 py-3 rounded-full ${name.trim() ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* 1. Fitness Goal Question - iOS Style - Optimized for no scrolling */}
        {onboardingStep === "fitness-goal" && (
          <div className="p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="ios-header text-xl mb-1">Fitness Goals</h1>
            <p className="ios-subheader text-sm mb-3">What is your primary fitness goal?</p>
            
            <div className="space-y-2">
              {/* Lose weight option - Compact */}
              <div 
                className={`p-3 ${fitnessGoal === "lose-weight" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setFitnessGoal("lose-weight")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-weight"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Lose weight</h3>
                  <p className="text-xs text-gray-500">Burn fat and improve metabolism</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${fitnessGoal === "lose-weight" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {fitnessGoal === "lose-weight" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Gain muscle option - Compact */}
              <div 
                className={`p-3 ${fitnessGoal === "gain-muscle" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setFitnessGoal("gain-muscle")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-dumbbell"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Gain muscle</h3>
                  <p className="text-xs text-gray-500">Build strength and increase muscle mass</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${fitnessGoal === "gain-muscle" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {fitnessGoal === "gain-muscle" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Improve endurance option - Compact */}
              <div 
                className={`p-3 ${fitnessGoal === "improve-endurance" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setFitnessGoal("improve-endurance")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-running"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Improve endurance</h3>
                  <p className="text-xs text-gray-500">Enhance cardiovascular fitness and energy</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${fitnessGoal === "improve-endurance" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {fitnessGoal === "improve-endurance" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Improve flexibility option - Compact */}
              <div 
                className={`p-3 ${fitnessGoal === "improve-flexibility" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setFitnessGoal("improve-flexibility")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-wind"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Improve flexibility</h3>
                  <p className="text-xs text-gray-500">Enhance mobility and range of motion</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${fitnessGoal === "improve-flexibility" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {fitnessGoal === "improve-flexibility" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* General fitness option - Compact */}
              <div 
                className={`p-3 ${fitnessGoal === "general-fitness" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setFitnessGoal("general-fitness")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-heart"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">General fitness</h3>
                  <p className="text-xs text-gray-500">Overall health and wellness</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${fitnessGoal === "general-fitness" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {fitnessGoal === "general-fitness" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Other option - Compact */}
              <div 
                className={`p-3 ${fitnessGoal === "other" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setFitnessGoal("other")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-plus"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Other</h3>
                  <p className="text-xs text-gray-500">A different fitness goal</p>
                  
                  {fitnessGoal === "other" && (
                    <div className="mt-2 ios-input-container">
                      <input
                        type="text"
                        placeholder="Please specify your goal"
                        className="ios-input pl-8 py-2 w-full text-xs"
                        value={otherFitnessGoal}
                        onChange={(e) => setOtherFitnessGoal(e.target.value)}
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-purple-500">
                        <i className="fas fa-pencil-alt text-xs"></i>
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${fitnessGoal === "other" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {fitnessGoal === "other" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            {/* iOS-style navigation buttons - Compact */}
            <div className="flex justify-between mt-4 px-2">
              <button 
                onClick={() => {
                  setIsNewUser(false);
                  setScreen('login');
                }}
                className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-all duration-200 hover:bg-gray-200"
              >
                <i className="fas fa-chevron-left text-gray-600 text-sm"></i>
              </button>
              
              <button 
                onClick={handleNextStep}
                disabled={!fitnessGoal || (fitnessGoal === "other" && !otherFitnessGoal.trim())}
                className={`flex items-center justify-center px-6 py-2 rounded-full shadow-sm transition-all duration-200 text-sm ${(fitnessGoal && (fitnessGoal !== "other" || otherFitnessGoal.trim())) ? 'ios-button' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <span className="mr-1">Next</span>
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* 2. Gender Question - iOS Style - Optimized for no scrolling */}
        {onboardingStep === "user-gender" && (
          <div className="p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="ios-header text-xl mb-1">About You</h1>
            <p className="ios-subheader text-sm mb-3">To match you with a coach you'll connect with, please tell us your gender:</p>
            
            <div className="space-y-2">
              {/* Male option - Compact */}
              <div 
                className={`p-3 ${userGender === "male" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setUserGender("male")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-mars"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Male</h3>
                  <p className="text-xs text-gray-500">Match with male coaches</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${userGender === "male" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {userGender === "male" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Female option - Compact */}
              <div 
                className={`p-3 ${userGender === "female" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setUserGender("female")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-venus"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Female</h3>
                  <p className="text-xs text-gray-500">Match with female coaches</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${userGender === "female" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {userGender === "female" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Non-binary option - Compact */}
              <div 
                className={`p-3 ${userGender === "non-binary" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setUserGender("non-binary")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-transgender-alt"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Non-binary</h3>
                  <p className="text-xs text-gray-500">Choose your coach preference</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${userGender === "non-binary" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {userGender === "non-binary" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Prefer not to say option - Compact */}
              <div 
                className={`p-3 ${userGender === "prefer-not-to-say" ? "ios-card bg-purple-50 border border-blue-200" : "ios-card"} flex items-center cursor-pointer transition-all duration-200`}
                onClick={() => setUserGender("prefer-not-to-say")}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fas fa-user-secret"></i>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">Prefer not to say</h3>
                  <p className="text-xs text-gray-500">No preference for coach matching</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-5 h-5 rounded-full ${userGender === "prefer-not-to-say" ? "bg-purple-500 shadow-sm" : "border-2 border-gray-300"} flex items-center justify-center transition-all duration-200`}>
                    {userGender === "prefer-not-to-say" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            {/* iOS-style navigation buttons - Compact */}
            <div className="flex justify-between mt-4 px-2">
              <button 
                onClick={handlePreviousStep}
                className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-all duration-200 hover:bg-gray-200"
              >
                <i className="fas fa-chevron-left text-gray-600 text-sm"></i>
              </button>
              
              <button 
                onClick={handleNextStep}
                disabled={!userGender}
                className={`flex items-center justify-center px-6 py-2 rounded-full shadow-sm transition-all duration-200 text-sm ${userGender ? 'ios-button' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <span className="mr-1">Next</span>
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* 3. Fitness Level Question */}
        {onboardingStep === "fitness-level" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Fitness Level</h1>
            <p className="text-gray-600 mb-6">How would you describe your current fitness level?</p>
            
            <div className="space-y-4">
              {/* Beginner option */}
              <div 
                className={`p-4 border ${fitnessLevel === "beginner" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setFitnessLevel("beginner")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-seedling"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Beginner</h3>
                  <p className="text-sm text-gray-500">New to fitness or just getting started</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${fitnessLevel === "beginner" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {fitnessLevel === "beginner" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Intermediate option */}
              <div 
                className={`p-4 border ${fitnessLevel === "intermediate" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setFitnessLevel("intermediate")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-running"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Intermediate</h3>
                  <p className="text-sm text-gray-500">Exercise regularly but not at an advanced level</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${fitnessLevel === "intermediate" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {fitnessLevel === "intermediate" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Advanced option */}
              <div 
                className={`p-4 border ${fitnessLevel === "advanced" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setFitnessLevel("advanced")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-medal"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Advanced</h3>
                  <p className="text-sm text-gray-500">Highly experienced and consistent with fitness</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${fitnessLevel === "advanced" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {fitnessLevel === "advanced" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!fitnessLevel}
                className={`px-6 py-3 rounded-full ${fitnessLevel ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 3. Preferred Workout Type */}
        {onboardingStep === "workout-type" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Preferred Workout Type</h1>
            <p className="text-gray-600 mb-6">What type of workouts do you enjoy or want to focus on?</p>
            
            <div className="space-y-4">
              {/* Strength Training option */}
              <div 
                className={`p-4 border ${workoutType === "strength" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutType("strength")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-dumbbell"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Strength Training</h3>
                  <p className="text-sm text-gray-500">Weightlifting, resistance training</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutType === "strength" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutType === "strength" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Cardio option */}
              <div 
                className={`p-4 border ${workoutType === "cardio" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutType("cardio")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-running"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Cardio</h3>
                  <p className="text-sm text-gray-500">Running, cycling, HIIT</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutType === "cardio" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutType === "cardio" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Calisthenics option */}
              <div 
                className={`p-4 border ${workoutType === "calisthenics" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutType("calisthenics")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-child"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Calisthenics</h3>
                  <p className="text-sm text-gray-500">Bodyweight exercises</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutType === "calisthenics" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutType === "calisthenics" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Yoga/Pilates option */}
              <div 
                className={`p-4 border ${workoutType === "yoga" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutType("yoga")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-pray"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Yoga/Pilates</h3>
                  <p className="text-sm text-gray-500">Flexibility, balance, core strength</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutType === "yoga" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutType === "yoga" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Mixed workouts option */}
              <div 
                className={`p-4 border ${workoutType === "mixed" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutType("mixed")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-random"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Mixed workouts</h3>
                  <p className="text-sm text-gray-500">Combination of strength and cardio</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutType === "mixed" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutType === "mixed" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Other option */}
              <div 
                className={`p-4 border ${workoutType === "other" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutType("other")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-plus"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Other</h3>
                  <p className="text-sm text-gray-500">A different workout type not listed above</p>
                  
                  {workoutType === "other" && (
                    <input
                      type="text"
                      placeholder="Please specify your workout type"
                      className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={otherWorkoutType}
                      onChange={(e) => setOtherWorkoutType(e.target.value)}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutType === "other" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutType === "other" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!workoutType || (workoutType === "other" && !otherWorkoutType.trim())}
                className={`px-6 py-3 rounded-full ${workoutType && (workoutType !== "other" || otherWorkoutType.trim()) ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 4. Weekly Availability */}
        {onboardingStep === "weekly-availability" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Weekly Availability</h1>
            <p className="text-gray-600 mb-6">How many days per week do you want to commit to working out?</p>
            
            <div className="space-y-4">
              {/* 1-2 days option */}
              <div 
                className={`p-4 border ${weeklyAvailability === "1-2" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWeeklyAvailability("1-2")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-calendar-day"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">1–2 days</h3>
                  <p className="text-sm text-gray-500">Getting started with a light schedule</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${weeklyAvailability === "1-2" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {weeklyAvailability === "1-2" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* 3-4 days option */}
              <div 
                className={`p-4 border ${weeklyAvailability === "3-4" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWeeklyAvailability("3-4")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-calendar-week"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">3–4 days</h3>
                  <p className="text-sm text-gray-500">Regular commitment with rest days</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${weeklyAvailability === "3-4" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {weeklyAvailability === "3-4" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* 5-6 days option */}
              <div 
                className={`p-4 border ${weeklyAvailability === "5-6" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWeeklyAvailability("5-6")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">5–6 days</h3>
                  <p className="text-sm text-gray-500">Dedicated training with occasional rest</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${weeklyAvailability === "5-6" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {weeklyAvailability === "5-6" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Every day option */}
              <div 
                className={`p-4 border ${weeklyAvailability === "7" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWeeklyAvailability("7")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Every day</h3>
                  <p className="text-sm text-gray-500">Daily training across various intensities</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${weeklyAvailability === "7" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {weeklyAvailability === "7" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!weeklyAvailability}
                className={`px-6 py-3 rounded-full ${weeklyAvailability ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 5. Workout Duration */}
        {onboardingStep === "workout-duration" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Workout Duration</h1>
            <p className="text-gray-600 mb-6">What is your preferred workout duration?</p>
            
            <div className="space-y-4">
              {/* Less than 30 minutes */}
              <div 
                className={`p-4 border ${workoutDuration === "less-30" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutDuration("less-30")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-stopwatch"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Less than 30 minutes</h3>
                  <p className="text-sm text-gray-500">Quick, focused sessions</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutDuration === "less-30" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutDuration === "less-30" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* 30-45 minutes */}
              <div 
                className={`p-4 border ${workoutDuration === "30-45" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutDuration("30-45")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">30-45 minutes</h3>
                  <p className="text-sm text-gray-500">Balanced duration for most workouts</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutDuration === "30-45" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutDuration === "30-45" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* 45-60 minutes */}
              <div 
                className={`p-4 border ${workoutDuration === "45-60" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutDuration("45-60")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">45 minutes – 1 hour</h3>
                  <p className="text-sm text-gray-500">Comprehensive sessions</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutDuration === "45-60" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutDuration === "45-60" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* More than 1 hour */}
              <div 
                className={`p-4 border ${workoutDuration === "more-60" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutDuration("more-60")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-hourglass-end"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">More than 1 hour</h3>
                  <p className="text-sm text-gray-500">Extended training sessions</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutDuration === "more-60" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutDuration === "more-60" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!workoutDuration}
                className={`px-6 py-3 rounded-full ${workoutDuration ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 6. Equipment Available */}
        {onboardingStep === "equipment" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Equipment Available</h1>
            <p className="text-gray-600 mb-6">What equipment do you have access to? (Select all that apply)</p>
            
            <div className="space-y-4">
              {/* Dumbbells */}
              <div 
                className={`p-4 border ${equipment.includes("dumbbells") ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  if (equipment.includes("dumbbells")) {
                    setEquipment(equipment.filter(item => item !== "dumbbells"));
                  } else {
                    setEquipment([...equipment, "dumbbells"]);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-dumbbell"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Dumbbells</h3>
                  <p className="text-sm text-gray-500">Hand-held weights</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${equipment.includes("dumbbells") ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {equipment.includes("dumbbells") && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Barbells */}
              <div 
                className={`p-4 border ${equipment.includes("barbells") ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  if (equipment.includes("barbells")) {
                    setEquipment(equipment.filter(item => item !== "barbells"));
                  } else {
                    setEquipment([...equipment, "barbells"]);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-weight"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Barbells</h3>
                  <p className="text-sm text-gray-500">Olympic bars and weight plates</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${equipment.includes("barbells") ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {equipment.includes("barbells") && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Resistance Bands */}
              <div 
                className={`p-4 border ${equipment.includes("resistance-bands") ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  if (equipment.includes("resistance-bands")) {
                    setEquipment(equipment.filter(item => item !== "resistance-bands"));
                  } else {
                    setEquipment([...equipment, "resistance-bands"]);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-tape"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Resistance Bands</h3>
                  <p className="text-sm text-gray-500">Elastic bands for resistance training</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${equipment.includes("resistance-bands") ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {equipment.includes("resistance-bands") && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Bodyweight Only */}
              <div 
                className={`p-4 border ${equipment.includes("bodyweight") ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  if (equipment.includes("bodyweight")) {
                    setEquipment(equipment.filter(item => item !== "bodyweight"));
                  } else {
                    setEquipment([...equipment, "bodyweight"]);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-child"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Bodyweight Only</h3>
                  <p className="text-sm text-gray-500">No equipment needed</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${equipment.includes("bodyweight") ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {equipment.includes("bodyweight") && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Cardio Machines */}
              <div 
                className={`p-4 border ${equipment.includes("cardio-machines") ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  if (equipment.includes("cardio-machines")) {
                    setEquipment(equipment.filter(item => item !== "cardio-machines"));
                  } else {
                    setEquipment([...equipment, "cardio-machines"]);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-running"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Treadmill/Rowing Machine</h3>
                  <p className="text-sm text-gray-500">Cardio equipment</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${equipment.includes("cardio-machines") ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {equipment.includes("cardio-machines") && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Other */}
              <div 
                className={`p-4 border ${equipment.includes("other") ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  if (equipment.includes("other")) {
                    setEquipment(equipment.filter(item => item !== "other"));
                  } else {
                    setEquipment([...equipment, "other"]);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-plus"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Other</h3>
                  <p className="text-sm text-gray-500">Specialized equipment not listed</p>
                  
                  {equipment.includes("other") && (
                    <input
                      type="text"
                      placeholder="Please specify your equipment"
                      className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={otherEquipment}
                      onChange={(e) => setOtherEquipment(e.target.value)}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${equipment.includes("other") ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {equipment.includes("other") && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={equipment.length === 0 || (equipment.includes("other") && !otherEquipment.trim())}
                className={`px-6 py-3 rounded-full ${equipment.length > 0 && (!equipment.includes("other") || otherEquipment.trim()) ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 7. Injury/Health Considerations */}
        {onboardingStep === "health-concerns" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Injury/Health Considerations</h1>
            <p className="text-gray-600 mb-6">Do you have any injuries or health concerns that we should know about?</p>
            
            <div className="space-y-4">
              {/* Yes option */}
              <div 
                className={`p-4 border ${hasHealthConcerns ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setHasHealthConcerns(true)}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-notes-medical"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Yes</h3>
                  <p className="text-sm text-gray-500">I have health concerns to consider</p>
                  
                  {hasHealthConcerns && (
                    <textarea
                      placeholder="Please describe your injuries or health concerns"
                      className="mt-2 w-full p-2 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={healthConcerns || ""}
                      onChange={(e) => setHealthConcerns(e.target.value)}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${hasHealthConcerns ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {hasHealthConcerns && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* No option */}
              <div 
                className={`p-4 border ${hasHealthConcerns === false ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => {
                  setHasHealthConcerns(false);
                  setHealthConcerns(null);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-heart"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">No</h3>
                  <p className="text-sm text-gray-500">I don't have any health concerns</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${hasHealthConcerns === false ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {hasHealthConcerns === false && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={hasHealthConcerns === null || (hasHealthConcerns && !healthConcerns?.trim())}
                className={`px-6 py-3 rounded-full ${(hasHealthConcerns === false || (hasHealthConcerns && healthConcerns?.trim())) ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 8. Motivation Style */}
        {onboardingStep === "motivation-style" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Motivation Style</h1>
            <p className="text-gray-600 mb-6">What motivates you the most to stay on track with your fitness journey?</p>
            
            <div className="space-y-4">
              {/* Tracking progress option */}
              <div 
                className={`p-4 border ${motivationStyle === "tracking" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setMotivationStyle("tracking")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Tracking progress and results</h3>
                  <p className="text-sm text-gray-500">Data-driven motivation</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${motivationStyle === "tracking" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {motivationStyle === "tracking" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Supportive option */}
              <div 
                className={`p-4 border ${motivationStyle === "supportive" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setMotivationStyle("supportive")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-heart"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Supportive and encouraging guidance</h3>
                  <p className="text-sm text-gray-500">Gentle motivation and positive reinforcement</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${motivationStyle === "supportive" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {motivationStyle === "supportive" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Community option */}
              <div 
                className={`p-4 border ${motivationStyle === "community" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setMotivationStyle("community")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-users"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Engaging with a fitness community</h3>
                  <p className="text-sm text-gray-500">Social support and accountability</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${motivationStyle === "community" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {motivationStyle === "community" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Challenges option */}
              <div 
                className={`p-4 border ${motivationStyle === "challenges" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setMotivationStyle("challenges")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Competing in challenges</h3>
                  <p className="text-sm text-gray-500">Goal-oriented competitions</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${motivationStyle === "challenges" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {motivationStyle === "challenges" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Other option */}
              <div 
                className={`p-4 border ${motivationStyle === "other" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setMotivationStyle("other")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-plus"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Other</h3>
                  <p className="text-sm text-gray-500">A different motivation not listed</p>
                  
                  {motivationStyle === "other" && (
                    <input
                      type="text"
                      placeholder="Please specify what motivates you"
                      className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={otherMotivationStyle}
                      onChange={(e) => setOtherMotivationStyle(e.target.value)}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${motivationStyle === "other" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {motivationStyle === "other" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!motivationStyle || (motivationStyle === "other" && !otherMotivationStyle.trim())}
                className={`px-6 py-3 rounded-full ${motivationStyle && (motivationStyle !== "other" || otherMotivationStyle.trim()) ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 9. Nutrition Preferences */}
        {onboardingStep === "nutrition" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Nutrition Preferences</h1>
            <p className="text-gray-600 mb-6">Are you interested in personalized nutrition guidance?</p>
            
            <div className="space-y-4">
              {/* Yes option */}
              <div 
                className={`p-4 border ${nutritionPreference === "yes" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setNutritionPreference("yes")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-apple-alt"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Yes, I want meal suggestions</h3>
                  <p className="text-sm text-gray-500">Personalized nutrition plans based on my fitness goals</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${nutritionPreference === "yes" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {nutritionPreference === "yes" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* No option */}
              <div 
                className={`p-4 border ${nutritionPreference === "no" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setNutritionPreference("no")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">No, I prefer to track my nutrition independently</h3>
                  <p className="text-sm text-gray-500">I'll handle my own nutrition planning</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${nutritionPreference === "no" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {nutritionPreference === "no" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Not sure option */}
              <div 
                className={`p-4 border ${nutritionPreference === "not-sure" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setNutritionPreference("not-sure")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-question-circle"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Not sure, but would like more info</h3>
                  <p className="text-sm text-gray-500">Provide more information about nutrition services</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${nutritionPreference === "not-sure" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {nutritionPreference === "not-sure" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!nutritionPreference}
                className={`px-6 py-3 rounded-full ${nutritionPreference ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 10. Ideal Trainer Style */}
        {onboardingStep === "trainer-style" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Ideal Trainer Style</h1>
            <p className="text-gray-600 mb-6">How would you like your trainer (AI) to communicate with you?</p>
            
            <div className="space-y-4">
              {/* Motivating option */}
              <div 
                className={`p-4 border ${trainerStyle === "motivating" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setTrainerStyle("motivating")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-bolt"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Motivating and enthusiastic</h3>
                  <p className="text-sm text-gray-500">High energy and encouraging communication</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${trainerStyle === "motivating" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {trainerStyle === "motivating" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Calm option */}
              <div 
                className={`p-4 border ${trainerStyle === "calm" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setTrainerStyle("calm")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-water"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Calm and supportive</h3>
                  <p className="text-sm text-gray-500">Gentle guidance and patience</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${trainerStyle === "calm" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {trainerStyle === "calm" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Direct option */}
              <div 
                className={`p-4 border ${trainerStyle === "direct" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setTrainerStyle("direct")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-bullseye"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Direct and goal-oriented</h3>
                  <p className="text-sm text-gray-500">Straightforward and focused on results</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${trainerStyle === "direct" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {trainerStyle === "direct" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Friendly option */}
              <div 
                className={`p-4 border ${trainerStyle === "friendly" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setTrainerStyle("friendly")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-smile"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Friendly and conversational</h3>
                  <p className="text-sm text-gray-500">Casual and approachable</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${trainerStyle === "friendly" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {trainerStyle === "friendly" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Other option */}
              <div 
                className={`p-4 border ${trainerStyle === "other" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setTrainerStyle("other")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-plus"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Other</h3>
                  <p className="text-sm text-gray-500">A different communication style</p>
                  
                  {trainerStyle === "other" && (
                    <input
                      type="text"
                      placeholder="Please specify your preferred style"
                      className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={otherTrainerStyle}
                      onChange={(e) => setOtherTrainerStyle(e.target.value)}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${trainerStyle === "other" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {trainerStyle === "other" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!trainerStyle || (trainerStyle === "other" && !otherTrainerStyle.trim())}
                className={`px-6 py-3 rounded-full ${trainerStyle && (trainerStyle !== "other" || otherTrainerStyle.trim()) ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 11. Optional: Workout Time Preference */}
        {onboardingStep === "optional-time" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Workout Time Preference (Optional)</h1>
            <p className="text-gray-600 mb-6">Do you prefer working out in the morning, afternoon, or evening?</p>
            
            <div className="space-y-4">
              {/* Morning option */}
              <div 
                className={`p-4 border ${workoutTime === "morning" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutTime("morning")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-sun"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Morning</h3>
                  <p className="text-sm text-gray-500">Early day workouts</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutTime === "morning" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutTime === "morning" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Afternoon option */}
              <div 
                className={`p-4 border ${workoutTime === "afternoon" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutTime("afternoon")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-cloud-sun"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Afternoon</h3>
                  <p className="text-sm text-gray-500">Midday training sessions</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutTime === "afternoon" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutTime === "afternoon" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Evening option */}
              <div 
                className={`p-4 border ${workoutTime === "evening" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setWorkoutTime("evening")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-moon"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Evening</h3>
                  <p className="text-sm text-gray-500">End of day workouts</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${workoutTime === "evening" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {workoutTime === "evening" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                className="px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 12. Optional: Coaching Experience */}
        {onboardingStep === "optional-experience" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Coaching Experience (Optional)</h1>
            <p className="text-gray-600 mb-6">What is your fitness experience with online coaching?</p>
            
            <div className="space-y-4">
              {/* First time option */}
              <div 
                className={`p-4 border ${coachingExperience === "first-time" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setCoachingExperience("first-time")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-star"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">First time using an AI trainer</h3>
                  <p className="text-sm text-gray-500">New to AI coaching</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${coachingExperience === "first-time" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {coachingExperience === "first-time" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* Online experience option */}
              <div 
                className={`p-4 border ${coachingExperience === "online-experience" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setCoachingExperience("online-experience")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-laptop"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Experienced with online coaching (but new to AI)</h3>
                  <p className="text-sm text-gray-500">Used online human coaches before</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${coachingExperience === "online-experience" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {coachingExperience === "online-experience" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
              
              {/* AI experience option */}
              <div 
                className={`p-4 border ${coachingExperience === "ai-experience" ? "border-primary bg-primary/5" : "border-gray-200"} rounded-xl flex items-center cursor-pointer hover:border-primary hover:bg-primary/5`}
                onClick={() => setCoachingExperience("ai-experience")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">Experienced with both human and AI coaching</h3>
                  <p className="text-sm text-gray-500">Used both human and AI coaches</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-6 h-6 rounded-full ${coachingExperience === "ai-experience" ? "bg-primary border-primary" : "border-2 border-gray-300"} flex items-center justify-center`}>
                    {coachingExperience === "ai-experience" && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePreviousStep}
                className="px-6 py-3 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                className="px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* 13. Coach Selection and Matching Result - iOS Style */}
        {onboardingStep === "coach-selection" && (
          <div className="p-4 relative">
            {/* Add confetti animation effect */}
            <div className="absolute -top-6 left-0 right-0 overflow-hidden h-32 pointer-events-none">
              <div className="animate-fall absolute left-1/4" style={{animationDelay: '0.2s'}}>
                <div className="w-3 h-3 bg-purple-500 rotate-45"></div>
              </div>
              <div className="animate-fall absolute left-1/3" style={{animationDelay: '0.5s'}}>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="animate-fall absolute left-1/2" style={{animationDelay: '0.1s'}}>
                <div className="w-4 h-4 bg-primary rotate-12"></div>
              </div>
              <div className="animate-fall absolute left-2/3" style={{animationDelay: '0.4s'}}>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="animate-fall absolute left-3/4" style={{animationDelay: '0.7s'}}>
                <div className="w-2 h-2 bg-purple-500 rotate-45"></div>
              </div>
            </div>

            <div className="text-center mb-6 animate-fade-in">
              <div className="inline-block mb-2">
                <div className="text-xl font-bold mb-2 relative animate-pulse-slow">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-primary-dark">🎉 Perfect Match Found! 🎉</span>
                </div>
                <p className="text-gray-600 text-sm">We've analyzed your profile and found an amazing coach for you!</p>
              </div>
              
              <div className="mt-4 max-w-md mx-auto ios-card p-3">
                <div className="flex items-center justify-between mb-2 text-xs font-semibold text-gray-700">
                  <span>Match analysis complete</span>
                  <span className="text-primary">100%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-full"></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                      <i className="fas fa-check text-xs"></i>
                    </div>
                    <span className="text-gray-600 text-xs">Goals</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                      <i className="fas fa-check text-xs"></i>
                    </div>
                    <span className="text-gray-600 text-xs">Coach</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                      <i className="fas fa-check text-xs"></i>
                    </div>
                    <span className="text-gray-600 text-xs">Plan</span>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="ios-header text-xl mb-1 flex items-center animate-slide-up" style={{animationDelay: '0.5s'}}>
              <i className="fas fa-trophy text-yellow-500 mr-2"></i>
              Your Perfect Coach Match
            </h1>
            <p className="ios-subheader text-sm mb-3 animate-slide-up" style={{animationDelay: '0.6s'}}>Based on your preferences and goals, we've matched you with the ideal coach for your fitness journey.</p>
            
            <div className="mb-4 ios-card transform transition-all duration-500 animate-slide-up" style={{animationDelay: '0.8s'}}>
              {selectedCoach === "max-stone" && (
                <div className="p-4 bg-white rounded-xl">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-purple-600 overflow-hidden shadow-sm relative coach-avatar">
                      <img 
                        src="/images/coaches/max-stone.jpg" 
                        alt="Max Stone - Strength Training Specialist" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-purple-600 opacity-10 mix-blend-overlay"></div>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-0.5">Max Stone</h2>
                      <p className="text-gray-600 text-sm mb-1">Strength Training Specialist</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-blue-800">
                        <i className="fas fa-award mr-1 text-xs"></i> Elite Coach
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 text-sm">
                    Max is a powerhouse when it comes to building muscle and increasing strength. With years of experience in powerlifting and bodybuilding, he's here to push you to new limits.
                  </p>
                  
                  <div className="ios-card p-3 bg-white">
                    <h3 className="font-semibold mb-2 text-sm text-gray-900">Coaching Style</h3>
                    <p className="text-gray-600 mb-3 text-xs">Direct, tough, and supportive. He'll make sure you're always lifting heavier and progressing.</p>
                    
                    <h3 className="font-semibold mb-2 text-sm text-gray-900">Specialties</h3>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-purple-100 text-blue-800 rounded-full text-xs">Strength Training</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-blue-800 rounded-full text-xs">Powerlifting</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-blue-800 rounded-full text-xs">Muscle Building</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCoach === "alexis-steel" && (
                <div className="p-8 bg-purple-50 rounded-xl shadow-sm">
                  <div className="flex items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-purple-600 overflow-hidden shadow-md relative coach-avatar">
                      <img 
                        src="/images/coaches/alexis-steel.jpg" 
                        alt="Alexis Steel - Strength Training Specialist" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-purple-600 opacity-10 mix-blend-overlay"></div>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-purple-900 mb-1">Alexis Steel</h2>
                      <p className="text-gray-600 mb-2">Strength Training Specialist</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <i className="fas fa-award mr-1"></i> Elite Coach
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                    Alexis believes strength is a mindset. With a background in both bodybuilding and functional fitness, she's ready to challenge you to exceed your goals with a combination of heavy lifting and muscle-focused workouts.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-lg text-purple-900">Coaching Style</h3>
                    <p className="text-gray-600 mb-5">Encouraging, tough love. She'll be by your side to help you power through every set.</p>
                    
                    <h3 className="font-semibold mb-3 text-lg text-purple-900">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Strength Training</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Functional Fitness</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Muscle Growth</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCoach === "ethan-dash" && (
                <div className="p-8 bg-red-50 rounded-xl shadow-sm">
                  <div className="flex items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-red-600 overflow-hidden shadow-md relative coach-avatar">
                      <img 
                        src="/images/coaches/ethan-dash.jpg" 
                        alt="Ethan Dash - Cardio and Endurance Specialist" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-red-600 opacity-10 mix-blend-overlay"></div>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-red-900 mb-1">Ethan Dash</h2>
                      <p className="text-gray-600 mb-2">Cardio and Endurance Specialist</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <i className="fas fa-award mr-1"></i> Elite Coach
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                    Ethan is all about pushing your limits, whether it's with high-intensity interval training or long-distance running. He'll help you build endurance and take your cardio performance to new heights.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-lg text-red-900">Coaching Style</h3>
                    <p className="text-gray-600 mb-5">Energetic, upbeat, and full of drive. Ethan's energy will make you love every sweat-filled minute.</p>
                    
                    <h3 className="font-semibold mb-3 text-lg text-red-900">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Running</span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">HIIT</span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Stamina Building</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCoach === "zoey-blaze" && (
                <div className="p-8 bg-orange-50 rounded-xl shadow-sm">
                  <div className="flex items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-orange-600 overflow-hidden shadow-md relative coach-avatar">
                      <img 
                        src="/images/coaches/zoey-blaze.jpg" 
                        alt="Zoey Blaze - Cardio and Endurance Specialist" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-orange-600 opacity-10 mix-blend-overlay"></div>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-orange-900 mb-1">Zoey Blaze</h2>
                      <p className="text-gray-600 mb-2">Cardio and Endurance Specialist</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <i className="fas fa-award mr-1"></i> Elite Coach
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                    Zoey's passion is speed and stamina. A former track and field athlete, she's dedicated to helping you improve your cardio performance through high-intensity and endurance-focused workouts.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-lg text-orange-900">Coaching Style</h3>
                    <p className="text-gray-600 mb-5">High-energy, inspiring, and motivating. Zoey's pep talks will keep you moving even when it gets tough.</p>
                    
                    <h3 className="font-semibold mb-3 text-lg text-orange-900">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Running</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">HIIT</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Endurance Training</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCoach === "kai-rivers" && (
                <div className="p-8 bg-teal-50 rounded-xl shadow-sm">
                  <div className="flex items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-teal-600 overflow-hidden shadow-md relative coach-avatar">
                      <img 
                        src="/images/coaches/kai-rivers.jpg" 
                        alt="Kai Rivers - Yoga and Flexibility Specialist" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-teal-600 opacity-10 mix-blend-overlay"></div>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-teal-900 mb-1">Kai Rivers</h2>
                      <p className="text-gray-600 mb-2">Yoga and Flexibility Specialist</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        <i className="fas fa-award mr-1"></i> Elite Coach
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                    Kai brings a calming yet powerful approach to flexibility and mobility. With years of experience in yoga, he'll guide you through every stretch and help you achieve deep flexibility and mindful movements.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-lg text-teal-900">Coaching Style</h3>
                    <p className="text-gray-600 mb-5">Soothing, calm, and patient. Kai encourages mindful progress and gives you space to grow at your own pace.</p>
                    
                    <h3 className="font-semibold mb-3 text-lg text-teal-900">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">Yoga</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">Mobility</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">Flexibility</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add the remaining coach profiles with similar structure */}
              {(selectedCoach !== "max-stone" && selectedCoach !== "alexis-steel" && 
                selectedCoach !== "ethan-dash" && selectedCoach !== "zoey-blaze" && 
                selectedCoach !== "kai-rivers") && (
                <div className="p-8 bg-purple-50 rounded-xl shadow-sm">
                  <div className="flex items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl shadow-md">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-blue-900 mb-1">
                        {selectedCoach === "lila-sage" ? "Lila Sage" :
                         selectedCoach === "leo-cruz" ? "Leo Cruz" :
                         selectedCoach === "maya-flex" ? "Maya Flex" :
                         selectedCoach === "nate-green" ? "Nate Green" :
                         selectedCoach === "sophie-gold" ? "Sophie Gold" :
                         selectedCoach === "dylan-power" ? "Dylan Power" :
                         selectedCoach === "ava-blaze" ? "Ava Blaze" :
                         selectedCoach === "ryder-swift" ? "Ryder Swift" :
                         selectedCoach === "chloe-fleet" ? "Chloe Fleet" : "Your Perfect Coach"}
                      </h2>
                      <p className="text-gray-600 mb-2">Fitness Specialist</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-blue-800">
                        <i className="fas fa-award mr-1"></i> Elite Coach
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                    Based on your preferences, we've matched you with a coach who specializes in the areas that matter most to you. They will guide you through personalized workouts designed to help you achieve your fitness goals.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-lg text-blue-900">Perfect Match Reason</h3>
                    <p className="text-gray-600 mb-5">Your coach has been selected based on your unique fitness goals, workout preferences, and the coaching style you indicated would work best for you.</p>
                    
                    <h3 className="font-semibold mb-3 text-lg text-blue-900">What's Next</h3>
                    <p className="text-gray-600">Start your journey with customized workout plans, progress tracking, and expert guidance every step of the way.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-primary-dark/10 to-primary/5 p-6 rounded-xl border border-primary/20 mb-8 shadow-sm animate-slide-up" style={{animationDelay: '1s'}}>
              <div className="flex items-start mb-4">
                <div className="bg-primary/20 p-3 rounded-full mr-4">
                  <i className="fas fa-magic text-primary text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2 text-primary-dark">Match Analysis</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our advanced AI matching system has analyzed over <span className="font-semibold">20 data points</span> from your profile including:
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                      <span className="text-sm text-gray-700">Fitness Goals</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                      <span className="text-sm text-gray-700">Training Style</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                      <span className="text-sm text-gray-700">Equipment Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                      <span className="text-sm text-gray-700">Gender Preference</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/60 rounded-lg">
                    <p className="text-primary-dark font-medium">Your personalized coaching experience will help you achieve your goals faster and more effectively with a coach who perfectly matches your style and needs.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* iOS-style navigation buttons */}
            <div className="flex justify-between mt-4 animate-slide-up" style={{animationDelay: '1.2s'}}>
              <button 
                onClick={handlePreviousStep}
                className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-all duration-200 hover:bg-gray-200"
              >
                <i className="fas fa-chevron-left text-gray-600 text-sm"></i>
              </button>
              <button 
                onClick={handleNextStep}
                className="ios-button px-6 py-2 rounded-full text-sm transition-all duration-200 flex items-center"
              >
                Start My Journey
                <div className="ml-2 relative">
                  <i className="fas fa-chevron-right text-xs"></i>
                </div>
              </button>
            </div>
          </div>
        )}
        

      </div>
    );
  };

  // Show premium preview screen
  // Convert all early returns to render functions
  const renderPremiumPreview = () => {
    if (!selectedCoach) return null;
    
    // Get coach color and icon based on the selected coach id
    let coachIcon = "fa-dumbbell";
    let coachColorClass = "bg-purple-600";
    
    if (selectedCoach.includes("kai") || selectedCoach === "lila-sage") {
      coachIcon = "fa-wind";
      coachColorClass = "bg-amber-500";
    } else if (selectedCoach.includes("ethan") || selectedCoach.includes("zoey") || selectedCoach.includes("ryder") || selectedCoach.includes("chloe")) {
      coachIcon = "fa-running";
      coachColorClass = "bg-red-600";
    } else if (selectedCoach.includes("leo") || selectedCoach.includes("maya")) {
      coachIcon = "fa-running";
      coachColorClass = "bg-green-600";
    } else if (selectedCoach.includes("nate") || selectedCoach.includes("sophie")) {
      coachIcon = "fa-seedling";
      coachColorClass = "bg-yellow-600";
    } else if (selectedCoach.includes("dylan") || selectedCoach.includes("ava")) {
      coachIcon = "fa-medal";
      coachColorClass = "bg-purple-600";
    }
    
    const coachName = selectedCoach
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return (
      <PremiumPreview
        coachName={coachName}
        coachIcon={coachIcon}
        coachColorClass={coachColorClass}
        onContinueToPayment={handleContinueToPayment}
        onStartFreeTrial={handleStartFreeTrial}
      />
    );
  };
  
  const renderSubscriptionPlans = () => (
    <SubscriptionPlans
      onSelectPlan={handleSelectPlan}
      onBack={handleBackFromPlans}
    />
  );
  
  const renderCheckout = () => (
    <CheckoutPage
      planName={selectedPlanName}
      price={planPrice}
      billingPeriod={billingPeriod}
      onBack={handleBackFromCheckout}
      onComplete={handleCompleteCheckout}
    />
  );

  // Show main app interface with the selected coach
  const renderMainOriginal = () => {
    // Display the main app with the selected coach
    console.log("Navigating to main app with coach:", selectedCoach);
    // Default to dylan-power coach if no coach is selected
    return (
      <MainApp 
        selectedCoach={selectedCoach || "dylan-power"} 
        onNavigateToScreen={(screen) => setScreen(screen as Screen)}
      />
    );
  };
  
  // Show chat interface
  const renderChatScreen = () => {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Chat header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="mr-3"
                onClick={() => setScreen('main')}
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
                  <i className="fas fa-running"></i>
                </div>
                <div className="ml-3">
                  <h2 className="font-bold text-lg">Kai</h2>
                  <div className="text-xs text-gray-500">Your Calisthenics Coach</div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
          {/* Introduction message */}
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
              <i className="fas fa-running"></i>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
              <p>Hi there! I'm Kai, your calisthenics coach. Ready to start your bodyweight fitness journey?</p>
              <div className="text-xs text-gray-400 mt-1 text-right">10:24 AM</div>
            </div>
          </div>
          
          {/* User response */}
          <div className="flex items-start justify-end">
            <div className="bg-primary text-white p-3 rounded-lg rounded-tr-none max-w-[80%]">
              <p>Yes! I'm excited to get started. I've never really done much bodyweight training before.</p>
              <div className="text-xs text-white/70 mt-1 text-right">10:25 AM</div>
            </div>
          </div>
          
          {/* Coach message with typing animation */}
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
              <i className="fas fa-running"></i>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
              <p>Perfect! Everyone starts somewhere. I've analyzed your onboarding answers and created a personalized plan for you.</p>
              <div className="text-xs text-gray-400 mt-1 text-right">10:26 AM</div>
            </div>
          </div>
          
          {/* Coach message with workout recommendation */}
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
              <i className="fas fa-running"></i>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
              <p>Here's what I recommend for today:</p>
              
              {/* Embedded workout card */}
              <div className="bg-white rounded-lg border border-gray-200 mt-2 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Upper Body Push Circuit</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Beginner</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <i className="fas fa-clock text-gray-400 mr-2"></i>
                    <span>25 minutes</span>
                    <i className="fas fa-fire text-gray-400 mx-2"></i>
                    <span>~180 calories</span>
                  </div>
                  <button className="w-full bg-primary text-white py-1.5 rounded-md text-sm">
                    Start Workout
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mt-1 text-right">10:27 AM</div>
            </div>
          </div>
          
          {/* User response */}
          <div className="flex items-start justify-end">
            <div className="bg-primary text-white p-3 rounded-lg rounded-tr-none max-w-[80%]">
              <p>Thanks! That looks doable. I'm a bit nervous about push-ups though. I can only do about 5 with good form.</p>
              <div className="text-xs text-white/70 mt-1 text-right">10:28 AM</div>
            </div>
          </div>
          
          {/* Coach response with AI analysis */}
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
              <i className="fas fa-running"></i>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
              <div className="mb-2">
                <span className="text-xs bg-purple-100 text-blue-700 rounded-full px-2 py-0.5">
                  <i className="fas fa-robot mr-1"></i>
                  AI Analysis
                </span>
              </div>
              <p>Don't worry about that! 5 good push-ups is a great starting point. I'll modify the workout to include:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li className="text-sm">Knee push-ups (3 sets of 8)</li>
                <li className="text-sm">Incline push-ups on a counter (2 sets of 6)</li>
                <li className="text-sm">Standard push-ups (1 set to failure)</li>
              </ul>
              <p className="mt-2">This progression will help build your strength gradually. Would you like me to explain proper form?</p>
              <div className="text-xs text-gray-400 mt-1 text-right">10:29 AM</div>
            </div>
          </div>
          
          {/* Quick reply options */}
          <div className="flex justify-center space-x-2 my-2">
            <button className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-white">
              Yes, show me proper form
            </button>
            <button className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-white">
              No, I'll figure it out
            </button>
          </div>
          
          {/* User response */}
          <div className="flex items-start justify-end">
            <div className="bg-primary text-white p-3 rounded-lg rounded-tr-none max-w-[80%]">
              <p>Yes, please! I want to make sure I'm doing them correctly from the start.</p>
              <div className="text-xs text-white/70 mt-1 text-right">10:30 AM</div>
            </div>
          </div>
          
          {/* Loading indicator */}
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
              <i className="fas fa-running"></i>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg rounded-tl-none flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        </div>
        
        {/* Message input and options */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex space-x-2 mb-2 overflow-x-auto scrollbar-hide pb-2">
            <button className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700 whitespace-nowrap">
              How many calories will I burn?
            </button>
            <button className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700 whitespace-nowrap">
              Can I do this every day?
            </button>
            <button className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700 whitespace-nowrap">
              What equipment do I need?
            </button>
            <button className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700 whitespace-nowrap">
              Show me a warm-up routine
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Type your message..."
              className="w-full bg-gray-100 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
              <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <i className="fas fa-microphone"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-primary hover:text-primary/80">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom navigation */}
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex justify-around">
            <button 
              className="flex flex-col items-center text-gray-400"
              onClick={() => setScreen('main')}
            >
              <i className="fas fa-home text-xl"></i>
              <span className="text-xs mt-1">Home</span>
            </button>
            <button 
              className="flex flex-col items-center text-primary"
              onClick={() => setScreen('chat')}
            >
              <i className="fas fa-comment text-xl"></i>
              <span className="text-xs mt-1">Chat</span>
            </button>
            <button 
              className="flex flex-col items-center text-gray-400"
              onClick={() => setScreen('profile')}
            >
              <i className="fas fa-user-circle text-xl"></i>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Auto-trigger biometric authentication when login screen appears
  useEffect(() => {
    const triggerBiometricAuth = async () => {
      if (screen === 'login' && isSupported && isRegistered && !biometricAttempted && !user) {
        setBiometricAttempted(true);
        setShowBiometricPrompt(true);
        
        // Small delay to show the prompt, then trigger biometric auth
        setTimeout(async () => {
          try {
            const result = await autoAuthenticate();
            if (result.success) {
              // Use working auth system for biometric login
              try {
                const response = await fetch('/api/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
                  credentials: 'include'
                });

                if (response.ok) {
                  const userData = await response.json();
                  // User state is now managed by auth provider
                  setShowBiometricPrompt(false);
                  if (!selectedCoach) {
                    setSelectedCoach("dylan-power");
                  }
                  setScreen('main');
                } else {
                  setShowBiometricPrompt(false);
                }
              } catch (error) {
                setShowBiometricPrompt(false);
              }
            } else {
              setShowBiometricPrompt(false);
            }
          } catch (error) {
            console.log('Biometric authentication cancelled or failed');
            setShowBiometricPrompt(false);
          }
        }, 800);
      }
    };

    triggerBiometricAuth();
  }, [screen, isSupported, isRegistered, biometricAttempted, user, autoAuthenticate, selectedCoach]);

  // Reset biometric attempt when leaving login screen
  useEffect(() => {
    if (screen !== 'login') {
      setBiometricAttempted(false);
      setShowBiometricPrompt(false);
    }
  }, [screen]);

  // Render content based on screen state - ALL HOOKS MUST BE CALLED BEFORE THIS POINT
  
  // Login screen rendering
  const renderLoginScreen = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Login popup card */}
        <div className="relative w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src="/thryvin-logo-new.png" 
                  alt="Thryvin' AI Coaching" 
                  className="w-64 h-20 object-contain" 
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Thryvin'</h1>
              <p className="text-gray-600">Sign in to continue your fitness journey</p>
            </div>
            
            {/* Login form */}
            <div className="space-y-5">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showLoginPassword ? "🙈" : "👁️"}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button 
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Forgot password?
                </button>
              </div>
              
              <button
                onClick={handleLogin}
                disabled={!email || !password}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Sign In
              </button>
              

              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/95 backdrop-blur-sm text-gray-500">New to Thryvin'?</span>
                </div>
              </div>
              
              {/* Features highlight */}
              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-dumbbell text-purple-600"></i>
                  </div>
                  <span>Personalized AI fitness coaching</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-chart-line text-pink-600"></i>
                  </div>
                  <span>Track your progress with detailed analytics</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-purple-600"></i>
                  </div>
                  <span>Join a supportive fitness community</span>
                </div>
              </div>
              
              {/* Start Your Journey button */}
              <button
                onClick={() => {
                  setIsNewUser(true);
                  setScreen('onboarding');
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Start Your Journey
              </button>
              
              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">Already have an account? Sign in above</span>
              </div>
            </div>

            {/* Biometric Authentication Prompt Overlay */}
            {showBiometricPrompt && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">
                      {isAuthenticating ? '🔄' : '🔒'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {isAuthenticating ? 'Authenticating...' : 'Use Biometric Login'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isAuthenticating 
                      ? 'Please use your fingerprint or Face ID to continue'
                      : 'Touch your fingerprint sensor or look at your camera to sign in'
                    }
                  </p>
                  <button
                    onClick={() => setShowBiometricPrompt(false)}
                    className="text-purple-600 font-medium hover:text-purple-700"
                  >
                    Use password instead
                  </button>
                </div>
              </div>
            )}

            {/* Biometric Setup Modal (shown after registration) */}
            {showBiometricSetupModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Secure Your Account
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Set up fingerprint or Face ID for quick and secure access to your account
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        const result = await biometricRegister(email || 'user@thryvin.com');
                        setShowBiometricSetupModal(false);
                        if (result.success) {
                          alert('Biometric authentication has been set up! You can now use fingerprint or Face ID to sign in.');
                        }
                        setScreen('premium-preview');
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
                    >
                      Set Up Now
                    </button>
                    <button
                      onClick={() => {
                        setShowBiometricSetupModal(false);
                        setScreen('premium-preview');
                      }}
                      className="w-full text-gray-600 py-3 px-4 rounded-xl font-medium hover:text-gray-800 transition-all"
                    >
                      Not Now
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    You can enable this later in Profile Settings
                  </p>
                </div>
              </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPasswordModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowForgotPasswordModal(false)}>
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
                    <p className="text-gray-600">Enter your email address and we'll send you a reset link</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleForgotPassword}
                        disabled={!forgotPasswordEmail || sendingResetEmail}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingResetEmail ? 'Sending...' : 'Send Reset Link'}
                      </button>
                      <button
                        onClick={() => setShowForgotPasswordModal(false)}
                        className="px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shortcut to Nutrition Demo */}
      </div>
    );
  };

  // Main app rendering function  
  const renderMainApp = () => {
    console.log("Navigating to main app with coach:", selectedCoach);
    
    return (
      <MainApp 
        selectedCoach={selectedCoach || "dylan-power"} 
        onNavigateToScreen={(targetScreen: ScreenString) => {
          const validScreens: Record<string, Screen> = {
            'profile': 'profile',
            'chat': 'chat',
            'main': 'main',
            'premium-preview': 'premium-preview' as Screen,
            'login': 'login',
            'profile-settings': 'profile-settings',
            'subscription-plans': 'subscription-plans',
            'checkout': 'checkout',
            'onboarding': 'onboarding',
            'splash': 'splash'
          };
          
          const newScreen = validScreens[targetScreen];
          if (newScreen) {
            setScreen(newScreen);
          } else {
            setScreen('main');
          }
        }}
      />
    );
  };
  
  // Show coach introduction screen
  const renderCoachIntro = () => (
    <CoachIntroduction
      coachId={selectedCoach || "dylan-power"}
      userData={{
        name: name || "User",
        fitnessGoal: fitnessGoal?.replace('-', ' ') || 'general fitness',
        fitnessLevel: fitnessLevel || 'beginner',
        workoutType: workoutType?.replace('-', ' ') || 'mixed',
        weeklyAvailability: weeklyAvailability || '3-4',
        workoutDuration: workoutDuration?.replace('-', '-') || '30-45'
      }}
      onContinue={() => setScreen('save-progress')}
    />
  );

  // Show save progress screen
  const renderSaveProgress = () => (
    <SaveProgressPrompt
      onContinue={() => setScreen('main')}
      onSkip={() => setScreen('main')}
      onRegister={handleRegistration} // Pass the working registration function
      coachData={{
        selectedCoach: selectedCoach || "dylan-power",
        trainingType: workoutType || "mixed",
        goal: fitnessGoal || "general-fitness",
        coachingStyle: trainerStyle || "supportive",
        name: name || "User", // Pass the name from onboarding
      }}
    />
  );

  // Shortcut to login and go directly to nutrition
  const handleQuickSave = async () => {
    try {
      // Login with test user
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123' 
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        // User state is now managed by auth provider
        
        // Set a default coach for the demo
        setSelectedCoach('nate-green'); // Nutrition specialist coach
        
        // Go directly to main app (it will open with nutrition tab via URL parameter)
        setScreen('main');
        
        // Navigate to nutrition tab after a short delay to ensure main app loads
        setTimeout(() => {
          window.location.href = '/?tab=nutrition';
        }, 100);
      } else {
        alert('Demo login failed!');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      alert('Demo login failed!');
    }
  };

  // Show profile settings screen
  const renderProfileSettings = () => (
    <ProfileSettings 
      onBack={() => setScreen('profile')}
      onSave={(profileData) => {
        console.log("Profile saved successfully:", profileData);
        // ProfileSettings component now handles saving to database automatically
        // Go back to profile screen after successful save
        setScreen('profile');
      }}
      // No initialData needed - component loads real user data from API
    />
  );

  // Show profile screen
  const renderProfile = () => (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Profile header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
        </div>
        
        <div className="p-4">
          {/* User info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <i className="fas fa-user text-2xl text-gray-400"></i>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold">John Doe</h2>
                <p className="text-gray-500">Member since April 2025</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-gray-500">Workouts</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-primary">320</div>
                <div className="text-sm text-gray-500">Minutes</div>
              </div>
            </div>
            
            <button 
              onClick={() => setScreen('profile-settings')}
              className="w-full py-2 border border-gray-300 rounded-md text-gray-600 flex items-center justify-center hover:bg-white"
            >
              <i className="fas fa-edit mr-2"></i>
              Edit Profile
            </button>
          </div>
          
          {/* Account settings */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-medium mb-4">Account Settings</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setScreen('profile-settings')}
                className="w-full flex items-center justify-between p-2 hover:bg-white rounded text-left"
              >
                <div className="flex items-center">
                  <i className="fas fa-bell text-gray-400 w-6"></i>
                  <span className="ml-3">Notifications</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              
              <button 
                onClick={() => setScreen('profile-settings')}
                className="w-full flex items-center justify-between p-2 hover:bg-white rounded text-left"
              >
                <div className="flex items-center">
                  <i className="fas fa-lock text-gray-400 w-6"></i>
                  <span className="ml-3">Privacy</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              
              <button 
                onClick={() => setScreen('profile-settings')}
                className="w-full flex items-center justify-between p-2 hover:bg-white rounded text-left"
              >
                <div className="flex items-center">
                  <i className="fas fa-palette text-gray-400 w-6"></i>
                  <span className="ml-3">Appearance</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              
              <button 
                onClick={() => setScreen('profile-settings')}
                className="w-full flex items-center justify-between p-2 hover:bg-white rounded text-left"
              >
                <div className="flex items-center">
                  <i className="fas fa-question-circle text-gray-400 w-6"></i>
                  <span className="ml-3">Help & Support</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
            </div>
          </div>
          
          <button className="w-full bg-gray-100 text-gray-600 p-3 rounded-md">
            Sign Out
          </button>
        </div>
        
        {/* Bottom navigation */}
        <div className="mt-auto bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex justify-around">
            <button 
              className="flex flex-col items-center text-gray-400"
              onClick={() => setScreen('main')}
            >
              <i className="fas fa-home text-xl"></i>
              <span className="text-xs mt-1">Home</span>
            </button>
            <button 
              className="flex flex-col items-center text-primary"
              onClick={() => setScreen('profile')}
            >
              <i className="fas fa-user-circle text-xl"></i>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </div>
  );
  
  // Show logo design interface
  const renderLogoDesign = () => (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Official Logo</h1>
            <p className="text-gray-600 text-lg">The professional brand identity for Thryvin' AI Coaching</p>
            <button 
              onClick={() => setScreen('splash')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
            >
              Back to App
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Official Logo */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm border border-white/20">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img 
                    src="/thryvin-logo-new.png" 
                    alt="Thryvin' AI Coaching" 
                    className="w-64 h-20 object-contain" 
                  />
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur-sm"></div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Official Logo</h3>
                <p className="text-white/80 text-sm">The professional Thryvin' AI Coaching brand</p>
              </div>
            </div>

            {/* Logo on Dark Background */}
            <div className="bg-gray-800 rounded-xl p-8 shadow-sm">
              <div className="flex justify-center mb-6">
                <img 
                  src="/thryvin-logo-new.png" 
                  alt="Thryvin' AI Coaching" 
                  className="w-64 h-20 object-contain" 
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Dark Background</h3>
                <p className="text-gray-300 text-sm">Logo visibility on dark themes</p>
              </div>
            </div>

            {/* Logo Option 3: Power Bolt */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm cursor-pointer hover:shadow-lg transition-shadow border border-white/20">
              <div className="flex justify-center mb-6">
                <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bolt3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="30" cy="30" r="25" fill="url(#bolt3)" />
                  <g transform="translate(30, 30)">
                    <path d="M-6,-12 L6,-2 L-2,-2 L6,12 L-6,2 L2,2 Z" fill="white" opacity="0.9"/>
                  </g>
                  <text x="65" y="25" fontFamily="Inter, system-ui, sans-serif" fontSize="24" fontWeight="800" fill="url(#bolt3)">Thryvin'</text>
                  <text x="65" y="40" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="500" fill="#6b7280" letterSpacing="1px">AI FITNESS COACHING</text>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Power Bolt</h3>
                <p className="text-white/80 text-sm">Energy and strength symbolized</p>
              </div>
            </div>

            {/* Logo Option 4: Geometric Flex */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm cursor-pointer hover:shadow-lg transition-shadow border border-white/20">
              <div className="flex justify-center mb-6">
                <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="flex4" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="30" cy="30" r="25" fill="url(#flex4)" />
                  <g transform="translate(30, 30)">
                    <path d="M-12,0 Q-8,-8 0,-6 Q8,-8 12,0 Q8,8 0,6 Q-8,8 -12,0 Z" fill="white" opacity="0.9"/>
                    <circle cx="0" cy="0" r="3" fill="url(#flex4)" opacity="0.8"/>
                  </g>
                  <text x="65" y="25" fontFamily="Inter, system-ui, sans-serif" fontSize="24" fontWeight="800" fill="url(#flex4)">Thryvin'</text>
                  <text x="65" y="40" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="500" fill="#6b7280" letterSpacing="1px">AI FITNESS COACHING</text>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Geometric Flex</h3>
                <p className="text-white/80 text-sm">Abstract muscle/flex representation</p>
              </div>
            </div>

            {/* Logo Option 5: Mountain Peak */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm cursor-pointer hover:shadow-lg transition-shadow border border-white/20">
              <div className="flex justify-center mb-6">
                <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="mountain5" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="30" cy="30" r="25" fill="url(#mountain5)" />
                  <g transform="translate(30, 30)">
                    <path d="M-15,10 L-5,-8 L0,-2 L8,-10 L15,10 Z" fill="white" opacity="0.9"/>
                    <path d="M-2,-2 L2,-6 L6,-2 L4,0 L0,0 Z" fill="url(#mountain5)" opacity="0.7"/>
                  </g>
                  <text x="65" y="25" fontFamily="Inter, system-ui, sans-serif" fontSize="24" fontWeight="800" fill="url(#mountain5)">Thryvin'</text>
                  <text x="65" y="40" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="500" fill="#6b7280" letterSpacing="1px">AI FITNESS COACHING</text>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Mountain Peak</h3>
                <p className="text-white/80 text-sm">Achievement and goal-reaching symbolism</p>
              </div>
            </div>

            {/* Logo Option 6: Circuit Connection */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm cursor-pointer hover:shadow-lg transition-shadow border border-white/20">
              <div className="flex justify-center mb-6">
                <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="circuit6" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="30" cy="30" r="25" fill="url(#circuit6)" />
                  <g transform="translate(30, 30)">
                    <circle cx="-8" cy="-8" r="3" fill="white" opacity="0.9"/>
                    <circle cx="8" cy="-8" r="3" fill="white" opacity="0.9"/>
                    <circle cx="0" cy="8" r="3" fill="white" opacity="0.9"/>
                    <circle cx="0" cy="0" r="2" fill="white" opacity="0.7"/>
                    <line x1="-8" y1="-8" x2="0" y2="0" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                    <line x1="8" y1="-8" x2="0" y2="0" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                    <line x1="0" y1="8" x2="0" y2="0" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                  </g>
                  <text x="65" y="25" fontFamily="Inter, system-ui, sans-serif" fontSize="24" fontWeight="800" fill="url(#circuit6)">Thryvin'</text>
                  <text x="65" y="40" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="500" fill="#6b7280" letterSpacing="1px">AI FITNESS COACHING</text>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Circuit Connection</h3>
                <p className="text-white/80 text-sm">AI and technology focus with connected nodes</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">What's Your Style?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-3xl mb-3">💪</div>
                <h3 className="font-medium text-white">Classic Fitness</h3>
                <p className="text-sm text-white/70">Traditional symbols, recognizable</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-3">🔬</div>
                <h3 className="font-medium text-white">Tech Forward</h3>
                <p className="text-sm text-white/70">AI-focused, modern approach</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-medium text-white">Creative & Unique</h3>
                <p className="text-sm text-white/70">Stand out from the crowd</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
  
  // Handle authentication redirects with useEffect (avoids hook order issues)
  useEffect(() => {
    // Only redirect from main screen if no user
    if (screen === 'main' && !user) {
      setScreen('login');
    }
    // Allow coach-intro, save-progress, and other onboarding screens without auth
    const allowedWithoutAuth = ['login', 'onboarding', 'splash', 'coach-intro', 'save-progress', 'premium-preview', 'subscription-plans', 'checkout'];
    if (!user && !allowedWithoutAuth.includes(screen)) {
      setScreen('login');
    }
  }, [user, screen]);

  // SINGLE RETURN POINT - All conditional rendering logic here
  // This ensures all hooks above are called every render
  
  
  if (screen === 'splash') {
    // Don't render anything - let the GSAP splash from index.html show through
    // The useEffect above will handle the transition when splashComplete event fires
    return null;
  }
  
  if (screen === 'login') {
    return renderLoginScreen();
  }
  
  if (screen === 'onboarding') {
    return renderOnboarding();
  }
  
  if (screen === 'coach-intro') {
    return renderCoachIntro();
  }
  
  if (screen === 'save-progress') {
    return renderSaveProgress();
  }
  
  if (screen === 'premium-preview') {
    return renderPremiumPreview();
  }
  
  if (screen === 'subscription-plans') {
    return renderSubscriptionPlans();
  }
  
  if (screen === 'checkout') {
    return renderCheckout();
  }
  
  if (screen === 'main' && user) {
    return renderMainApp();
  }
  
  if (screen === 'chat') {
    return renderChatScreen();
  }
  
  if (screen === 'profile') {
    return renderProfile();
  }
  
  if (screen === 'profile-settings') {
    return renderProfileSettings();
  }
  
  if (screen === 'logo-design') {
    return renderLogoDesign();
  }
  
  
  // Default fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <ThryvinLogo 
        size="xl" 
        animated={true}
        className="text-white"
      />
    </div>
  );
}
