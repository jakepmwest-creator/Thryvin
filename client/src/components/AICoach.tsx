import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Zap, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth-v2';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AICoachProps {
  coachInfo: {
    name: string;
    role: string;
    icon: string;
    colorClass: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function AICoach({ coachInfo, isOpen, onClose }: AICoachProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi ${user?.name || 'there'}! I'm ${coachInfo.name}, your ${coachInfo.role}. I'm here to help you achieve your fitness goals. What would you like to work on today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/coach/chat", {
        message,
        coach: coachInfo.name.toLowerCase().replace(/\s+/g, '-'),
        trainingType: user?.trainingType || 'general',
        coachingStyle: user?.coachingStyle || 'supportive'
      });
      return await res.json();
    },
    onSuccess: (response) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: Zap, label: "Quick Workout", message: "I need a quick 15-minute workout for today" },
    { icon: Target, label: "Set Goals", message: "Help me set realistic fitness goals" },
    { icon: TrendingUp, label: "Track Progress", message: "How am I progressing towards my goals?" }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col"
        >
          {/* Header */}
          <div className={`${coachInfo.colorClass} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <i className={`fas ${coachInfo.icon} text-lg`}></i>
              </div>
              <div>
                <h3 className="font-semibold">{coachInfo.name}</h3>
                <p className="text-sm opacity-90">{coachInfo.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser ? 'bg-purple-500' : coachInfo.colorClass
                  }`}>
                    {message.isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.isUser 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${coachInfo.colorClass}`}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t">
            <div className="flex space-x-2 mb-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const userMessage: Message = {
                      id: Date.now().toString(),
                      content: action.message,
                      isUser: true,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, userMessage]);
                    sendMessageMutation.mutate(action.message);
                  }}
                  className="flex-1 flex flex-col items-center p-2 h-auto"
                >
                  <action.icon className="w-4 h-4 mb-1" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about fitness..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}