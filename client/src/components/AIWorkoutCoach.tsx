import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bot, Send, X, Zap, Heart, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AIWorkoutCoachProps {
  currentExercise: {
    name: string;
    reps: number;
    sets: number;
    instructions: string;
  };
  currentSet: number;
  isRestTime: boolean;
  timeRemaining: number;
  workoutType: string;
}

interface CoachMessage {
  id: string;
  content: string;
  type: 'motivation' | 'instruction' | 'correction' | 'encouragement';
  timestamp: Date;
}

export function AIWorkoutCoach({ 
  currentExercise, 
  currentSet, 
  isRestTime, 
  timeRemaining,
  workoutType 
}: AIWorkoutCoachProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [userInput, setUserInput] = useState('');

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/coach/chat", {
        message,
        context: {
          currentExercise: currentExercise.name,
          currentSet,
          isRestTime,
          timeRemaining,
          workoutType
        }
      });
      return await res.json();
    },
    onSuccess: (response) => {
      const newMessage: CoachMessage = {
        id: Date.now().toString(),
        content: response.response,
        type: 'instruction',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  });

  // Auto-generate coaching messages based on workout state
  useEffect(() => {
    if (currentExercise) {
      const motivationMessages = [
        `Great job on ${currentExercise.name}! Focus on proper form.`,
        `You're doing ${currentExercise.name} - remember: ${currentExercise.instructions}`,
        `Set ${currentSet} of ${currentExercise.sets} - keep pushing!`,
        isRestTime ? `Rest time! Take ${timeRemaining} seconds to recover.` : `Time to work! Give it your all on this set.`
      ];

      const newMessage: CoachMessage = {
        id: Date.now().toString(),
        content: motivationMessages[Math.floor(Math.random() * motivationMessages.length)],
        type: isRestTime ? 'encouragement' : 'motivation',
        timestamp: new Date()
      };

      setMessages(prev => {
        // Only add if it's different from the last message
        if (prev.length === 0 || prev[prev.length - 1].content !== newMessage.content) {
          return [...prev.slice(-2), newMessage]; // Keep only last 3 messages
        }
        return prev;
      });
    }
  }, [currentExercise, currentSet, isRestTime]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      content: userInput,
      type: 'instruction',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(userInput);
    setUserInput('');
  };

  const quickActions = [
    { icon: Zap, label: "Need Help", message: "I need help with this exercise" },
    { icon: Heart, label: "Too Hard", message: "This is too difficult, can you modify it?" },
    { icon: Timer, label: "More Time", message: "I need more rest time" }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80"
          >
            <Card className="bg-white shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">AI Coach</h3>
                      <p className="text-xs text-gray-500">Real-time guidance</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                  {messages.slice(-3).map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg text-sm ${
                        message.content.includes('I need') || message.content.includes('can you')
                          ? 'bg-purple-50 text-blue-800 ml-4'
                          : 'bg-gray-50 text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                  
                  {sendMessageMutation.isPending && (
                    <div className="flex space-x-1 p-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const message: CoachMessage = {
                          id: Date.now().toString(),
                          content: action.message,
                          type: 'instruction',
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, message]);
                        sendMessageMutation.mutate(action.message);
                      }}
                      className="flex flex-col items-center p-2 h-auto text-xs"
                    >
                      <action.icon className="w-3 h-3 mb-1" />
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex space-x-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask your coach..."
                    className="flex-1 text-sm"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Coach Button */}
      <motion.button
        className={`w-14 h-14 bg-purple-500 text-white rounded-full shadow-lg flex items-center justify-center ${
          isRestTime ? 'bg-orange-500' : 'bg-purple-500'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
        animate={{
          boxShadow: isRestTime 
            ? '0 0 20px rgba(249, 115, 22, 0.5)' 
            : '0 0 20px rgba(59, 130, 246, 0.5)'
        }}
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && !isExpanded && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            {messages.length > 9 ? '9+' : messages.length}
          </div>
        )}
      </motion.button>
    </div>
  );
}