import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2 } from 'lucide-react';
import { apiRequest } from "../../lib/queryClient";
import { MicrophoneButton } from '../ui/MicrophoneButton';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName: string;
  coachIcon: string;
  coachColorClass: string;
  initialMessage?: string;
}

export default function ChatModal({ isOpen, onClose, coachName, coachIcon, coachColorClass, initialMessage }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hey! I'm ${coachName}, your AI fitness coach. Ask me anything about fitness, nutrition, motivation, or just chat about your day. I'm here to help with whatever you need!`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set initial message when chat opens
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setInputMessage(initialMessage);
    }
  }, [initialMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/chat', {
        message: userMessage.content,
        coachName: coachName,
        coachSpecialty: "Fitness",
        conversationHistory: messages.slice(-10)
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm having trouble connecting right now, but I'm here when you need me! Try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden border border-gray-200"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-between rounded-t-3xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm border border-white/30">
                <i className={`${coachIcon} text-lg`}></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">{coachName}</h3>
                <p className="text-xs opacity-90 font-medium">Your AI Fitness Coach</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/30 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/30 to-pink-50/30">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white mr-3 flex-shrink-0 shadow-lg border-2 border-white">
                    <i className={`${coachIcon} text-sm`}></i>
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-md border border-purple-400'
                      : 'bg-white text-gray-800 rounded-tl-md border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white mr-3 flex-shrink-0 shadow-lg border-2 border-white">
                  <i className={`${coachIcon} text-sm`}></i>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-md shadow-lg border border-gray-200">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 border-t border-pink-200/50 bg-gradient-to-r from-purple-50 to-pink-50 rounded-b-3xl">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or tap the mic to speak..."
                  className="w-full bg-white/80 backdrop-blur-sm border-2 border-pink-200/50 rounded-2xl px-5 py-3 pr-12 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 shadow-lg transition-all duration-200 hover:shadow-xl focus:bg-white"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <MicrophoneButton
                    onSpeechResult={(text) => {
                      setInputMessage(text.trim());
                    }}
                    disabled={isLoading}
                    size="sm"
                    className="border-0 bg-transparent hover:bg-pink-100 text-pink-600"
                    showVisualFeedback={false}
                  />
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-sm transform hover:scale-105 active:scale-95 border border-white/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}