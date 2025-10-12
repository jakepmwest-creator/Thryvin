import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingChatButtonProps {
  onChatOpen: () => void;
  coachName: string;
  coachIcon: string;
  coachColorClass: string;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  onChatOpen,
  coachName,
  coachIcon,
  coachColorClass
}) => {
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  // Show greeting after 3 seconds if it hasn't been dismissed yet
  React.useEffect(() => {
    if (!greetingDismissed) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [greetingDismissed]);

  const handleButtonClick = () => {
    setShowGreeting(false);
    onChatOpen();
  };

  const dismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGreeting(false);
    setGreetingDismissed(true);
  };

  return (
    <div className="fixed bottom-28 right-6 z-50 flex items-end">
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="mr-3 p-3 rounded-xl shadow-lg max-w-xs bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="relative">
                <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
                <p className="text-sm font-medium">
                  Hi! Need help with your workout today?
                </p>
              </div>
              <button 
                onClick={dismissGreeting}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Chat with {coachName} for personalized guidance
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        className="relative"
        data-tutorial="coach-chat-button"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleButtonClick}
          className="floating-chat-button w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-white relative bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300" 
          style={{ 
            boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)" 
          }}
        >
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-br from-red-400 to-red-500 rounded-full border-2 border-white animate-pulse"></span>
          <div className="flex flex-col items-center">
            <i className="fas fa-comment-dots text-xl mb-0.5"></i>
            <span className="text-xs font-medium opacity-90">Coach</span>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FloatingChatButton;