import React from "react";
import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete?: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  // Auto complete after 2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        {/* Logo bouncing in from the left */}
        <motion.div 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 120, 
            damping: 8,
            delay: 0.1
          }}
          className="mb-8"
        >
          <motion.img 
            src="/thryvin-logo-new.png" 
            alt="Thryvin' AI Coaching" 
            className="w-80 h-auto object-contain mx-auto"
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </motion.div>
        
        {/* Loading Dots below logo */}
        <motion.div 
          className="flex justify-center space-x-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <motion.div 
            className="w-3 h-3 bg-purple-500 rounded-full"
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 1.0, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0 
            }}
          />
          <motion.div 
            className="w-3 h-3 bg-purple-500 rounded-full"
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 1.0, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0.15 
            }}
          />
          <motion.div 
            className="w-3 h-3 bg-purple-500 rounded-full"
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 1.0, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0.3 
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;