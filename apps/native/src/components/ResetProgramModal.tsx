import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../stores/workout-store';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  aiMessage: '#F3E8FF',
};

interface ResetProgramModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
}

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
}

const QUICK_OPTIONS = [
  { icon: 'flash', label: 'More intense workouts', prompt: "I want more intense and challenging workouts" },
  { icon: 'time', label: 'Shorter sessions', prompt: "I need shorter workout sessions, around 30 minutes" },
  { icon: 'heart', label: 'More cardio', prompt: "I want to include more cardio exercises" },
  { icon: 'barbell', label: 'More strength', prompt: "I want to focus more on strength training" },
  { icon: 'body', label: 'I have an injury', prompt: "I have a recent injury and need modified exercises" },
  { icon: 'refresh', label: 'Complete refresh', prompt: "I want a completely new program with fresh exercises" },
];

export const ResetProgramModal = ({ visible, onClose, onReset }: ResetProgramModalProps) => {
  const { resetProgram } = useWorkoutStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset state and show welcome message
      setMessages([
        {
          id: '1',
          text: "Hey! 👋 I'm here to help you reset your workout program.\n\nTell me what you'd like to change - maybe you want more variety, different intensity, or focus on specific areas?\n\nYou can type below or tap a quick option!",
          isAI: true,
          timestamp: new Date(),
        }
      ]);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const addMessage = (text: string, isAI: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isAI,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickOption = async (option: typeof QUICK_OPTIONS[0]) => {
    addMessage(option.prompt, false);
    await simulateAIResponse(option.prompt);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, false);
    await simulateAIResponse(userMessage);
  };

  const simulateAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let response = '';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('intense') || lowerMessage.includes('challenging')) {
      response = "Got it! 🔥 I'll crank up the intensity for you.\n\nYour new program will include:\n• More compound movements\n• Shorter rest periods\n• Progressive overload challenges\n• High-intensity finisher circuits\n\nReady to generate your new program?";
    } else if (lowerMessage.includes('short') || lowerMessage.includes('30 min') || lowerMessage.includes('quick')) {
      response = "No problem! ⏱️ I'll design efficient 30-minute sessions.\n\nYour workouts will feature:\n• Supersets to maximize time\n• Full-body compound moves\n• Minimal rest circuits\n• Quick warm-up routines\n\nShall I create this new program for you?";
    } else if (lowerMessage.includes('cardio')) {
      response = "Let's get that heart pumping! ❤️\n\nYour new program will add:\n• More HIIT sessions\n• Running/cycling recommendations\n• Jump rope circuits\n• Cardio finishers after strength\n\nWant me to generate this cardio-focused program?";
    } else if (lowerMessage.includes('strength')) {
      response = "Time to build some serious strength! 💪\n\nYour new program will focus on:\n• Heavy compound lifts\n• Progressive overload tracking\n• Proper periodization\n• Adequate recovery time\n\nReady for your new strength program?";
    } else if (lowerMessage.includes('injury') || lowerMessage.includes('hurt') || lowerMessage.includes('pain')) {
      response = "I'm sorry to hear that! 🤕 Let me help you train safely.\n\nPlease tell me:\n• Which body part is affected?\n• Is it acute or chronic?\n\nI'll modify all exercises to avoid straining that area while keeping you active.";
    } else if (lowerMessage.includes('refresh') || lowerMessage.includes('new') || lowerMessage.includes('different')) {
      response = "Fresh start coming up! ✨\n\nI'll create a brand new 21-day program with:\n• Completely different exercise selection\n• New workout structures\n• Varied training splits\n• Exciting challenges\n\nReady to begin your fresh journey?";
    } else {
      response = `Thanks for sharing! 📝\n\nI understand you want to: ${userMessage}\n\nI'll incorporate this into your new 21-day program. The AI will consider your preferences when generating fresh workouts.\n\nAnything else you'd like to add, or shall I generate your new program?`;
    }
    
    addMessage(response, true);
    setIsLoading(false);
  };

  const handleGenerateProgram = async () => {
    setIsResetting(true);
    addMessage("Generating your new personalized 21-day program... 🚀", true);
    
    try {
      await resetProgram();
      
      setTimeout(() => {
        addMessage("✅ Done! Your fresh workout program is ready!\n\nHead to the Workouts tab to see your new schedule. Remember, consistency is key - you've got this! 💪", true);
        setIsResetting(false);
        
        // Auto close after showing success
        setTimeout(() => {
          onReset();
          onClose();
        }, 2000);
      }, 2000);
    } catch (error) {
      addMessage("❌ Oops! Something went wrong. Please try again or close and retry from the profile.", true);
      setIsResetting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Ionicons name="fitness" size={28} color={COLORS.white} />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Reset Program</Text>
                <Text style={styles.headerSubtitle}>Chat with AI to customize</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <View 
                key={message.id} 
                style={[styles.messageBubble, message.isAI ? styles.aiMessage : styles.userMessage]}
              >
                {message.isAI && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                  </View>
                )}
                <Text style={[styles.messageText, !message.isAI && styles.userMessageText]}>
                  {message.text}
                </Text>
              </View>
            ))}
            
            {isLoading && (
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                </View>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Options */}
          {messages.length <= 2 && !isLoading && (
            <View style={styles.quickOptionsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {QUICK_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickOption}
                    onPress={() => handleQuickOption(option)}
                  >
                    <Ionicons name={option.icon as any} size={16} color={COLORS.accent} />
                    <Text style={styles.quickOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your preferences..."
              placeholderTextColor={COLORS.mediumGray}
              multiline
              maxLength={500}
              editable={!isLoading && !isResetting}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Generate Button */}
          {messages.length > 2 && !isResetting && (
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerateProgram}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.generateGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="rocket" size={20} color={COLORS.white} />
                <Text style={styles.generateText}>Generate New Program</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  aiMessage: {
    backgroundColor: COLORS.aiMessage,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userMessage: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    flex: 1,
  },
  userMessageText: {
    color: COLORS.white,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  quickOptionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  quickOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  generateButton: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
