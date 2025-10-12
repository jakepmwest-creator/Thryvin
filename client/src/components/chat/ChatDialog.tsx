import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneButton } from '../ui/MicrophoneButton';

interface Message {
  id: string;
  text: string;
  sender: 'coach' | 'user';
  timestamp: Date;
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coachName: string;
  coachIcon: string;
  coachColorClass: string;
  coachRole: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  isOpen,
  onClose,
  coachName,
  coachIcon,
  coachColorClass,
  coachRole
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi there! I'm ${coachName}, your ${coachRole.toLowerCase()}. How can I help you today?`,
      sender: 'coach',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Sample quick replies
  const quickReplies = [
    "What's my workout for today?",
    "How do I improve my form?",
    "Can you modify my routine?",
    "I'm feeling sore, what should I do?"
  ];

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate coach typing
    setIsTyping(true);
    
    // Simulate coach response after a delay
    setTimeout(() => {
      setIsTyping(false);
      
      // Generate a dynamic response based on user input
      let response = '';
      const userText = inputValue.toLowerCase();
      
      if (userText.includes('workout') || userText.includes('exercise')) {
        response = `I've prepared a personalized workout routine based on your goals. It includes exercises targeting your specific needs with proper progression.`;
      } else if (userText.includes('form') || userText.includes('technique')) {
        response = `Great question about form! Proper technique is crucial for effective training and injury prevention. I'd be happy to review your form or provide specific guidance.`;
      } else if (userText.includes('sore') || userText.includes('pain')) {
        response = `It's normal to feel some soreness after training, but sharp pain should be addressed. Make sure to incorporate proper recovery techniques including stretching, hydration, and adequate rest.`;
      } else if (userText.includes('hello') || userText.includes('hi')) {
        response = `Hello! It's great to see you. How is your fitness journey going today?`;
      } else {
        response = `Thanks for reaching out! As your personal coach, I'm here to help with your fitness goals. What specific aspect of your training would you like guidance on?`;
      }
      
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'coach',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, coachMessage]);
    }, 1500);
  };

  // Format time to show only hours and minutes
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:items-center md:justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />
          
          {/* Chat dialog */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-md h-[80vh] md:h-[600px] rounded-t-xl md:rounded-xl shadow-xl z-10 flex flex-col overflow-hidden"
          >
            {/* Chat header */}
            <div className={`${coachColorClass} text-white p-4 flex items-center justify-between`}>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <i className={`fas ${coachIcon}`}></i>
                </div>
                <div className="ml-3">
                  <div className="font-bold">{coachName}</div>
                  <div className="text-xs opacity-80">{coachRole}</div>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.sender === 'coach' && (
                      <div className={`${coachColorClass} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0`}>
                        <i className={`fas ${coachIcon}`}></i>
                      </div>
                    )}
                    <div 
                      className={`rounded-lg p-3 max-w-[70%] ${
                        message.sender === 'user' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white shadow-sm rounded-tl-none'
                      }`}
                    >
                      <p>{message.text}</p>
                      <div 
                        className={`text-xs mt-1 text-right ${
                          message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`${coachColorClass} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0`}>
                      <i className={`fas ${coachIcon}`}></i>
                    </div>
                    <div className="bg-white shadow-sm rounded-lg rounded-tl-none p-4 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Quick replies */}
            <div className="p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-t border-purple-200/50">
              <div className="flex overflow-x-auto space-x-2 pb-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    className="bg-white/80 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 text-gray-700 text-xs px-3 py-1.5 rounded-full whitespace-nowrap border border-purple-200/50 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105"
                    onClick={() => {
                      setInputValue(reply);
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Message input */}
            <div className="p-3 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-t border-purple-200/50 rounded-b-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message or tap the mic to speak..."
                  className="w-full pl-4 pr-20 py-2.5 rounded-2xl border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-lg transition-all duration-200 hover:shadow-xl focus:bg-white text-sm"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <MicrophoneButton
                    onSpeechResult={(text) => {
                      setInputValue(text.trim());
                    }}
                    size="sm"
                    className="border-0 bg-transparent hover:bg-purple-100 text-purple-600"
                    showVisualFeedback={false}
                  />
                </div>
                <button
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    inputValue.trim() 
                      ? 'text-purple-600 hover:bg-purple-100 active:scale-95 shadow-sm' 
                      : 'text-gray-400'
                  }`}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatDialog;