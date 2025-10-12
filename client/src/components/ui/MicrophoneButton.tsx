import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechToTextImproved } from '@/hooks/useSpeechToTextImproved';
import { useToast } from '@/hooks/use-toast';

interface MicrophoneButtonProps {
  onSpeechResult: (text: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showVisualFeedback?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onSpeechResult,
  disabled = false,
  size = 'md',
  className = '',
  showVisualFeedback = true,
}) => {
  const { toast } = useToast();
  const [isPressed, setIsPressed] = useState(false);
  const [interimText, setInterimText] = useState('');

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
    transcript,
  } = useSpeechToTextImproved({
    onResult: (text) => {
      if (text.trim()) {
        onSpeechResult(text.trim());
      }
    },
    onError: (errorMessage) => {
      toast({
        title: "Speech Recognition Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onStart: () => {
      setInterimText('');
      toast({
        title: "Listening...",
        description: "Speak now, tap the microphone again to stop",
      });
    },
    onEnd: () => {
      setInterimText('');
      toast({
        title: "Speech captured",
        description: "Text has been added to your message",
      });
    },
    continuous: false,
    language: 'en-US',
  });

  // Update interim text with current transcript
  React.useEffect(() => {
    if (isListening && transcript) {
      setInterimText(transcript);
    }
  }, [transcript, isListening]);

  const handleMicClick = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser. Please try Chrome or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopListening();
      setIsPressed(false);
    } else {
      startListening();
      setIsPressed(true);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={true}
        className={`${sizeClasses[size]} rounded-full opacity-50 ${className}`}
        onClick={handleMicClick}
      >
        <MicOff size={iconSizes[size]} />
      </Button>
    );
  }

  return (
    <div className="relative">
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          variant={isListening ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          className={`
            ${sizeClasses[size]} 
            rounded-full 
            relative 
            overflow-hidden 
            ${isListening 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-500 shadow-lg' 
              : 'hover:bg-purple-50 text-purple-600 border-purple-200'
            }
            ${className}
          `}
          onClick={handleMicClick}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center justify-center"
              >
                <Mic size={iconSizes[size]} />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center justify-center"
              >
                <Mic size={iconSizes[size]} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulse animation when listening */}
          <AnimatePresence>
            {isListening && showVisualFeedback && (
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ 
                  scale: [1, 1.8, 1], 
                  opacity: [0.8, 0.1, 0.8] 
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-purple-400 -z-10"
              />
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Speech feedback text */}
      <AnimatePresence>
        {isListening && interimText && showVisualFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap max-w-xs truncate z-10 shadow-lg"
          >
            {interimText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Volume2 size={8} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact version for tight spaces
export const CompactMicrophoneButton: React.FC<MicrophoneButtonProps> = (props) => {
  return (
    <MicrophoneButton
      {...props}
      size="sm"
      showVisualFeedback={false}
      className="border-0 shadow-sm"
    />
  );
};