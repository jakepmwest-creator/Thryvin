import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, Target, Calendar, Clock, ChevronRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThryvinLogo } from './ui/ThryvinLogo';

interface CoachIntroductionProps {
  coachId: string;
  userData: {
    name: string;
    fitnessGoal: string;
    fitnessLevel: string;
    workoutType: string;
    weeklyAvailability: string;
    workoutDuration: string;
  };
  onContinue: () => void;
}

const coachData = {
  "max-stone": {
    name: "Max Stone",
    specialty: "Strength Training",
    avatar: "💪",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    experience: "8+ years",
    rating: 4.9,
    clients: 850,
    description: "Powerlifting champion turned coach. I'll help you build serious strength.",
    specialties: ["Powerlifting", "Olympic Lifting", "Functional Strength"],
    welcomeMessage: "Ready to get seriously strong? Let's build some real power together!",
    philosophy: "Strength isn't just physical - it's mental resilience built rep by rep."
  },
  "alexis-steel": {
    name: "Alexis Steel",
    specialty: "Strength & Conditioning",
    avatar: "🏋️‍♀️",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    experience: "6+ years",
    rating: 4.8,
    clients: 720,
    description: "Former athlete, now helping others reach their strength goals.",
    specialties: ["Athletic Performance", "Injury Prevention", "Competition Prep"],
    welcomeMessage: "Time to unlock your athletic potential! I'm here to guide every step.",
    philosophy: "Every champion was once a beginner who refused to give up."
  },
  "ethan-dash": {
    name: "Ethan Dash",
    specialty: "Cardio & Endurance",
    avatar: "🏃‍♂️",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-purple-50",
    borderColor: "border-blue-200",
    experience: "7+ years",
    rating: 4.9,
    clients: 920,
    description: "Marathon runner and endurance specialist. Let's build your cardio base.",
    specialties: ["Running", "HIIT Training", "Endurance Sports"],
    welcomeMessage: "Let's get that heart pumping! Endurance is built one step at a time.",
    philosophy: "The only impossible journey is the one you never begin."
  },
  "zoey-blaze": {
    name: "Zoey Blaze",
    specialty: "HIIT & Cardio",
    avatar: "🔥",
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    experience: "5+ years",
    rating: 4.8,
    clients: 680,
    description: "High-energy trainer specializing in fat-burning workouts.",
    specialties: ["HIIT", "Metabolic Training", "Fat Loss"],
    welcomeMessage: "Ready to turn up the heat? Let's torch some calories together!",
    philosophy: "Your body can do it. It's your mind you need to convince."
  },
  "kai-rivers": {
    name: "Kai Rivers",
    specialty: "Yoga & Mindfulness",
    avatar: "🧘‍♂️",
    color: "from-green-500 to-teal-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    experience: "10+ years",
    rating: 4.9,
    clients: 1200,
    description: "Certified yoga instructor focused on mind-body connection.",
    specialties: ["Hatha Yoga", "Meditation", "Flexibility"],
    welcomeMessage: "Welcome to your journey of inner and outer strength. Let's flow together.",
    philosophy: "Yoga is not about touching your toes, it's about what you learn on the way down."
  },
  "lila-sage": {
    name: "Lila Sage",
    specialty: "Yoga & Flexibility",
    avatar: "🌸",
    color: "from-pink-500 to-purple-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    experience: "8+ years",
    rating: 4.9,
    clients: 950,
    description: "Gentle yoga practitioner helping you find balance and flexibility.",
    specialties: ["Restorative Yoga", "Stretching", "Mind-Body Wellness"],
    welcomeMessage: "Let's create space for growth, both physically and mentally.",
    philosophy: "Flexibility is not about being able to do the splits, it's about adapting to life."
  },
  "leo-cruz": {
    name: "Leo Cruz",
    specialty: "Calisthenics",
    avatar: "🤸‍♂️",
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    experience: "6+ years",
    rating: 4.8,
    clients: 740,
    description: "Bodyweight movement specialist. Let's master your own body.",
    specialties: ["Bodyweight Training", "Movement Flow", "Skill Development"],
    welcomeMessage: "Your body is your gym! Let's unlock amazing movement patterns together.",
    philosophy: "Master your bodyweight, master yourself."
  },
  "maya-flex": {
    name: "Maya Flex",
    specialty: "Bodyweight & Flexibility",
    avatar: "🤸‍♀️",
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    experience: "7+ years",
    rating: 4.9,
    clients: 820,
    description: "Movement artist combining strength with graceful flexibility.",
    specialties: ["Contortion", "Flow Movement", "Bodyweight Strength"],
    welcomeMessage: "Let's explore the beautiful intersection of strength and flexibility!",
    philosophy: "Movement is medicine for the mind, body, and soul."
  },
  "dylan-power": {
    name: "Dylan Power",
    specialty: "General Fitness",
    avatar: "⚡",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    experience: "9+ years",
    rating: 4.9,
    clients: 1100,
    description: "All-around fitness expert helping you become your best self.",
    specialties: ["Total Body Fitness", "Lifestyle Coaching", "Habit Building"],
    welcomeMessage: "Ready to transform your life? I'm here to guide you every step of the way!",
    philosophy: "Fitness isn't a destination, it's a way of life."
  }
};

export const CoachIntroduction: React.FC<CoachIntroductionProps> = ({ 
  coachId, 
  userData, 
  onContinue 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [drumrollPlaying, setDrumrollPlaying] = useState(true);
  const coach = coachData[coachId as keyof typeof coachData] || coachData["dylan-power"];

  useEffect(() => {
    // Start with drumroll effect
    const drumrollTimer = setTimeout(() => {
      setDrumrollPlaying(false);
      setShowDetails(true);
      
      // Big celebration when coach is revealed
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      });

      // Multiple confetti bursts
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 }
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 }
        });
      }, 400);

    }, 3000);

    return () => clearTimeout(drumrollTimer);
  }, []);

  if (drumrollPlaying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center px-8">
          {/* Logo */}
          <ThryvinLogo 
            size="xl" 
            animated={true}
            className="mb-8"
          />

          <motion.div
            className="text-6xl mb-8"
            animate={{ 
              scale: [1, 1.1, 1, 1.1, 1],
              rotate: [0, -3, 3, -3, 0]
            }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🎯
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold text-gray-800 mb-6"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Finding Your Perfect Coach...
          </motion.h1>
          
          <motion.div 
            className="flex justify-center space-x-3 mb-8"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
          </motion.div>

          <motion.p 
            className="text-gray-600 text-lg max-w-lg mx-auto leading-relaxed"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Analyzing your goals, fitness level, and preferences to match you with the perfect AI trainer for your journey.
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-y-auto scrollbar-hide">
      <div className="max-h-screen overflow-y-auto scrollbar-hide px-4 py-8">
        <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className=""
          >
            <div className="max-w-lg mx-auto">
              {/* Header with Logo */}
              <div className="text-center mb-8">
                <ThryvinLogo 
                  size="lg" 
                  animated={true}
                  className="mb-6"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  className="relative inline-block"
                >
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl border-4 border-white">
                    <span className="text-5xl">{coach.avatar}</span>
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                </motion.div>
                
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Meet {coach.name}!
                </motion.h1>
                
                <motion.p 
                  className="text-lg font-medium text-gray-600 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {coach.specialty} Specialist
                </motion.p>

                <motion.div
                  className="flex items-center justify-center space-x-4 text-sm text-gray-600"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{coach.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-purple-500 mr-1" />
                    <span>{coach.experience}</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 text-green-500 mr-1" />
                    <span>{coach.clients}+ clients</span>
                  </div>
                </motion.div>
              </div>

              {/* Welcome Message */}
              <motion.div
                className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <span>Welcome message for {userData.name}:</span>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </h3>
                <p className="text-gray-700 italic leading-relaxed">
                  "{coach.welcomeMessage}"
                </p>
              </motion.div>

              {/* Coach Details */}
              <motion.div
                className="bg-white rounded-2xl border border-purple-100 p-6 mb-6 space-y-6 shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <span>About {coach.name.split(' ')[0]}</span>
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{coach.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <span>Specialties</span>
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((specialty, index) => (
                      <span 
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <span>Philosophy</span>
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  </h4>
                  <p className="text-gray-600 text-sm italic leading-relaxed">"{coach.philosophy}"</p>
                </div>
              </motion.div>

              {/* Perfect Match */}
              <motion.div
                className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
              >
                <h3 className="font-semibold text-purple-800 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <Target className="w-3 h-3 text-white" />
                  </div>
                  Why {coach.name.split(' ')[0]} is perfect for you
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></span>
                    <span className="font-medium">Goal:</span>
                    <span className="ml-2">{userData.fitnessGoal.replace('-', ' ')} - {coach.specialty} specialist</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></span>
                    <span className="font-medium">Level:</span>
                    <span className="ml-2">{userData.fitnessLevel} - {coach.experience} experience</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-3 text-purple-600" />
                    <span className="font-medium">Schedule:</span>
                    <span className="ml-2">{userData.weeklyAvailability} days/week</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-3 text-purple-600" />
                    <span className="font-medium">Duration:</span>
                    <span className="ml-2">{userData.workoutDuration.replace('-', '-')} minute sessions</span>
                  </div>
                </div>
              </motion.div>

              {/* Continue Button */}
              <motion.button
                onClick={() => {
                  localStorage.setItem('thryvin-onboarding-just-completed', 'true');
                  onContinue();
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 hover:from-purple-600 hover:to-pink-600"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <span>Start Training with {coach.name.split(' ')[0]}</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              <motion.p
                className="text-center text-sm text-gray-500 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Ready to begin your personalized fitness journey?
              </motion.p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};