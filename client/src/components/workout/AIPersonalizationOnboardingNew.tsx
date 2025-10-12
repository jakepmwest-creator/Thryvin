import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ArrowLeft, ArrowRight, CheckCircle, Loader2, Brain, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  question: string;
  placeholder: string;
  helpText: string;
}

interface OnboardingResponse {
  stepId: string;
  question: string;
  response: string;
  timestamp: Date;
}

interface AIPersonalizationOnboardingNewProps {
  onComplete: (responses: OnboardingResponse[]) => void;
  onBack: () => void;
  className?: string;
}

export const AIPersonalizationOnboardingNew: React.FC<AIPersonalizationOnboardingNewProps> = ({
  onComplete,
  onBack,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(-1); // Start with welcome screen
  const [responses, setResponses] = useState<OnboardingResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'fitness-goal',
      question: 'What\'s your main fitness goal right now?',
      placeholder: 'Tell me about what you\'re hoping to achieve with your fitness journey...',
      helpText: 'Share your specific goals, whether it\'s weight loss, building muscle, improving endurance, or something else entirely.'
    },
    {
      id: 'training-time',
      question: 'When do you prefer to work out and how much time can you dedicate?',
      placeholder: 'Describe your ideal workout schedule...',
      helpText: 'Let me know your preferred times of day, how many days per week, and how long each session should be.'
    },
    {
      id: 'cardio-preference',
      question: 'How do you feel about cardio workouts?',
      placeholder: 'Share your thoughts on cardio exercises...',
      helpText: 'Tell me about your relationship with cardio - do you love it, hate it, or somewhere in between?'
    },
    {
      id: 'focus-areas',
      question: 'What body parts or fitness aspects would you like to focus on?',
      placeholder: 'Describe what you\'d like to work on most...',
      helpText: 'Whether it\'s specific muscle groups, flexibility, balance, or overall conditioning.'
    },
    {
      id: 'injury-history',
      question: 'Do you have any injuries, limitations, or areas we should be careful with?',
      placeholder: 'Tell me about any physical concerns or past injuries...',
      helpText: 'This helps me create safer, more personalized workouts that work around any limitations.'
    },
    {
      id: 'motivation',
      question: 'What motivates you most to stay active and stick with your fitness routine?',
      placeholder: 'Share what drives you to keep going...',
      helpText: 'Understanding your motivation helps me provide the right kind of encouragement and support.'
    }
  ];

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setCurrentResponse(prev => prev + finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'aborted') {
          toast({
            title: 'Voice input error',
            description: 'There was an issue with voice recognition. Please try again.',
            variant: 'destructive'
          });
        }
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.removeEventListener('result', () => {});
        recognition.removeEventListener('error', () => {});
        recognition.removeEventListener('end', () => {});
        if (isRecording) {
          recognition.stop();
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      toast({
        title: 'Voice input not supported',
        description: 'Your browser doesn\'t support voice input. Please type your response.',
        variant: 'destructive'
      });
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        if (recognition.state === 'listening') {
          recognition.stop();
          setTimeout(() => {
            recognition.start();
          }, 100);
        } else {
          recognition.start();
        }
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: 'Voice input error',
          description: 'Could not start voice recognition. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleNextStep = () => {
    if (!currentResponse.trim()) {
      toast({
        title: 'Response required',
        description: 'Please provide a response before continuing.',
        variant: 'destructive'
      });
      return;
    }

    const newResponse: OnboardingResponse = {
      stepId: onboardingSteps[currentStep].id,
      question: onboardingSteps[currentStep].question,
      response: currentResponse.trim(),
      timestamp: new Date()
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setCurrentResponse('');

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete(updatedResponses);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Restore previous response if available
      const previousResponse = responses[currentStep - 1];
      if (previousResponse) {
        setCurrentResponse(previousResponse.response);
        // Remove the current response from the array
        setResponses(responses.slice(0, -1));
      }
    }
  };

  const handleComplete = async (finalResponses: OnboardingResponse[]) => {
    setIsSubmitting(true);
    try {
      await onComplete(finalResponses);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: 'There was an issue saving your responses. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Welcome Screen
  if (currentStep === -1) {
    return (
      <div className={`h-screen bg-white flex flex-col justify-center p-6 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mx-auto"
        >
          {/* Header with gradient */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              AI Personalization
            </h1>
            
            <p className="text-gray-600 text-base">
              Let's create your perfect workout plan together.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Smart Workouts</h3>
                <p className="text-xs text-gray-600">Tailored to your goals</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <Mic className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Voice Input</h3>
                <p className="text-xs text-gray-600">Speak or type naturally</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Adaptive Training</h3>
                <p className="text-xs text-gray-600">Plans that evolve</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => setCurrentStep(0)}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-2xl shadow-lg text-lg"
          >
            Build You Schedule
          </Button>
          
        </motion.div>
      </div>
    );
  }

  // Questions Flow
  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <div className={`h-screen bg-white flex flex-col ${className}`}>
      <div className="flex-1 flex flex-col px-6 py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Let's Personalize Your AI Coach
          </h1>
          <p className="text-gray-600">
            Help me understand you better so I can create the perfect workout plan
          </p>
          
          {/* Progress */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-2xl p-6 flex-1 flex flex-col"
          >
            <div className="flex flex-col h-full">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentStepData.question}
                </h2>
                <p className="text-gray-600">
                  {currentStepData.helpText}
                </p>
              </div>

              {/* Response Area */}
              <div className="flex-1 flex flex-col mt-6 mb-4">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    placeholder={currentStepData.placeholder}
                    className="w-full min-h-32 p-4 pr-16 text-base border-2 border-gray-200 focus:border-purple-400 rounded-xl resize-none bg-white focus:outline-none"
                    disabled={isRecording}
                  />
                  
                  {/* Voice Input Button */}
                  <Button
                    type="button"
                    onClick={toggleRecording}
                    className={`absolute bottom-3 right-3 w-10 h-10 p-0 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                    }`}
                    disabled={!recognition}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4 text-white" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-4"
                  >
                    <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Listening...</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={currentStep === 0 ? onBack : handlePreviousStep}
                  className="flex items-center gap-2 px-6 py-3 border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {currentStep === 0 ? 'Back' : 'Previous'}
                </Button>

                <Button
                  onClick={handleNextStep}
                  disabled={!currentResponse.trim() || isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 text-white font-semibold rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : currentStep === onboardingSteps.length - 1 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : currentStep === onboardingSteps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};