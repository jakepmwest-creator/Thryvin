import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../stores/workout-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  action?: {
    type: 'swap_days' | 'modify_workout' | 'regenerate' | 'add_exercise' | 'remove_exercise' | 'change_intensity';
    params?: any;
    label?: string;
  };
}

const QUICK_ACTIONS = [
  { icon: 'swap-horizontal', label: 'Swap days', prompt: 'I need to swap workout days' },
  { icon: 'time', label: 'Shorter workout', prompt: 'Make today\'s workout shorter, around 30 minutes' },
  { icon: 'flame', label: 'More intense', prompt: 'I want a more intense workout today' },
  { icon: 'bed', label: 'Rest day', prompt: 'Can I take today as a rest day instead?' },
  { icon: 'refresh', label: 'New workout', prompt: 'Generate a completely new workout for today' },
  { icon: 'help', label: 'Form tips', prompt: 'Give me form tips for my exercises today' },
];

interface AICoachWidgetProps {
  visible: boolean;
  onClose: () => void;
}

export const AICoachWidget = ({ visible, onClose }: AICoachWidgetProps) => {
  const { weekWorkouts, swapWorkoutDays, forceRegenerateWeek, currentWorkout } = useWorkoutStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  useEffect(() => {
    if (visible) {
      // Initialize with welcome message
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          text: "Hey! I'm your AI fitness coach. 🏋️‍♂️\n\nI can help you:\n• Swap workout days\n• Modify today's workout\n• Adjust intensity\n• Answer fitness questions\n\nWhat can I help you with?",
          isAI: true,
        }]);
      }
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  
  const addMessage = (text: string, isAI: boolean, action?: Message['action']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isAI,
      action,
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    addMessage(action.prompt, false);
    processMessage(action.prompt);
  };
  
  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, false);
    processMessage(userMessage);
  };
  
  const processMessage = async (message: string) => {
    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const lowerMessage = message.toLowerCase();
    
    // Detect swap days intent
    if (lowerMessage.includes('swap') || lowerMessage.includes('switch') || lowerMessage.includes('change')) {
      if (lowerMessage.includes('wednesday') && lowerMessage.includes('thursday')) {
        addMessage(
          "Got it! You want to swap Wednesday and Thursday workouts. 📅\n\nWednesday's workout will move to Thursday, and Thursday's will move to Wednesday.\n\nShall I make this swap?",
          true,
          { type: 'swap_days', params: { from: 2, to: 3 }, label: 'Swap Wed ↔ Thu' }
        );
      } else if (lowerMessage.includes('today') && lowerMessage.includes('tomorrow')) {
        const today = new Date().getDay();
        const todayIndex = today === 0 ? 6 : today - 1;
        const tomorrowIndex = (todayIndex + 1) % 7;
        addMessage(
          "I can swap today's workout with tomorrow's. 📅\n\nThis will move your current workout to tomorrow.\n\nWant me to do this?",
          true,
          { type: 'swap_days', params: { from: todayIndex, to: tomorrowIndex }, label: 'Swap Today ↔ Tomorrow' }
        );
      } else {
        addMessage(
          "Which days would you like to swap? You can say something like:\n\n• 'Swap Wednesday with Thursday'\n• 'Switch today with tomorrow'\n• 'Move Friday's workout to Saturday'",
          true
        );
      }
    }
    // Detect rest day intent
    else if (lowerMessage.includes('rest') || lowerMessage.includes('skip') || lowerMessage.includes('day off')) {
      addMessage(
        "Taking a rest day is totally fine! 😌 Recovery is important.\n\nI can:\n1. Mark today as a rest day\n2. Move today's workout to another day\n\nWhat would you prefer?",
        true
      );
    }
    // Detect intensity change
    else if (lowerMessage.includes('intense') || lowerMessage.includes('harder') || lowerMessage.includes('challenging')) {
      addMessage(
        "Let's crank up the intensity! 🔥\n\nFor today's workout, I can:\n• Add supersets\n• Reduce rest periods\n• Add extra sets\n• Include a finisher circuit\n\nYour workout will be regenerated with higher intensity. Ready?",
        true,
        { type: 'change_intensity', params: { level: 'high' }, label: 'Increase Intensity' }
      );
    }
    // Detect shorter workout
    else if (lowerMessage.includes('short') || lowerMessage.includes('quick') || lowerMessage.includes('30 min') || lowerMessage.includes('less time')) {
      addMessage(
        "Got it! Let me optimize your workout for time. ⏱️\n\nI'll:\n• Focus on compound movements\n• Use supersets to save time\n• Keep you moving with minimal rest\n\nYour workout will be ~30 minutes. Sound good?",
        true,
        { type: 'modify_workout', params: { duration: 30 }, label: 'Make It Quick' }
      );
    }
    // Detect regenerate intent
    else if (lowerMessage.includes('new workout') || lowerMessage.includes('regenerate') || lowerMessage.includes('different')) {
      addMessage(
        "Fresh workout coming up! 💪\n\nI'll generate a brand new workout targeting the same muscle groups but with different exercises and structure.\n\nReady to regenerate?",
        true,
        { type: 'regenerate', label: 'Generate New Workout' }
      );
    }
    // Detect form/tips
    else if (lowerMessage.includes('form') || lowerMessage.includes('tip') || lowerMessage.includes('how to')) {
      const workout = currentWorkout;
      if (workout && workout.exercises?.length > 0) {
        const exercise = workout.exercises[0];
        addMessage(
          `Here are some key form tips for ${exercise.name || 'your exercises'}:\n\n• Keep your core tight throughout\n• Focus on controlled movements\n• Full range of motion is key\n• Breathe out on the effort\n\nWant tips for a specific exercise?`,
          true
        );
      } else {
        addMessage(
          "I'd be happy to help with form tips! 📚\n\nWhich exercise would you like tips for? Some popular ones:\n• Squats\n• Deadlifts\n• Bench Press\n• Pull-ups",
          true
        );
      }
    }
    // General response
    else {
      addMessage(
        "I can help with that! 🤔\n\nHere's what I can do:\n• Swap workout days\n• Adjust workout intensity\n• Make workouts shorter/longer\n• Give form tips\n• Regenerate today's workout\n\nTry asking specifically what you need!",
        true
      );
    }
    
    setIsLoading(false);
  };
  
  const executeAction = async (action: Message['action']) => {
    if (!action) return;
    
    setIsLoading(true);
    addMessage(`Executing: ${action.label || action.type}...`, false);
    
    try {
      switch (action.type) {
        case 'swap_days':
          if (action.params?.from !== undefined && action.params?.to !== undefined) {
            await swapWorkoutDays(action.params.from, action.params.to);
            addMessage("Done! ✅ I've swapped your workout days. Check your schedule to see the changes.", true);
          }
          break;
          
        case 'regenerate':
          await forceRegenerateWeek();
          addMessage("Done! ✅ Your workout has been regenerated with fresh exercises. Check it out!", true);
          break;
          
        case 'change_intensity':
        case 'modify_workout':
          // For now, trigger regeneration
          await forceRegenerateWeek();
          addMessage("Done! ✅ Your workout has been updated. Head to your workout to see the changes!", true);
          break;
          
        default:
          addMessage("I've noted your request. This feature is coming soon! 🚀", true);
      }
    } catch (error) {
      addMessage("Oops! Something went wrong. Please try again. 😓", true);
    }
    
    setIsLoading(false);
    setPendingAction(null);
  };
  
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.coachIcon}>
                <Ionicons name="sparkles" size={20} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Coach</Text>
                <Text style={styles.headerSubtitle}>Your personal fitness assistant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>
          
          {/* Messages */}
          <KeyboardAvoidingView 
            style={styles.messagesWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View key={message.id}>
                  <View 
                    style={[
                      styles.messageBubble, 
                      message.isAI ? styles.aiMessage : styles.userMessage
                    ]}
                  >
                    {message.isAI && (
                      <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                      </View>
                    )}
                    <Text style={[styles.messageText, !message.isAI && styles.userMessageText]}>
                      {message.text}
                    </Text>
                  </View>
                  
                  {/* Action button if present */}
                  {message.action && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => executeAction(message.action)}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentSecondary]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                        <Text style={styles.actionText}>{message.action.label || 'Confirm'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              {isLoading && (
                <View style={[styles.messageBubble, styles.aiMessage]}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                  </View>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={COLORS.accent} />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
            
            {/* Quick Actions */}
            {messages.length <= 2 && (
              <View style={styles.quickActionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {QUICK_ACTIONS.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickAction}
                      onPress={() => handleQuickAction(action)}
                      disabled={isLoading}
                    >
                      <Ionicons name={action.icon as any} size={16} color={COLORS.accent} />
                      <Text style={styles.quickActionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor={COLORS.mediumGray}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Floating button to open the coach
export const AICoachButton = ({ onPress }: { onPress: () => void }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.floatingButton, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.floatingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={26} color={COLORS.white} />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  messagesWrapper: {
    flex: 1,
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
    marginBottom: 10,
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
    width: 22,
    height: 22,
    borderRadius: 11,
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
  actionButton: {
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginTop: -4,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  quickActionText: {
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
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
