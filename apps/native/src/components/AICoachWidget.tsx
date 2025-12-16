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
import { useCoachStore } from '../stores/coach-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-app-1.preview.emergentagent.com';

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
    type: 'swap_days' | 'modify_workout' | 'regenerate' | 'add_exercise' | 'remove_exercise' | 'change_intensity' | 'add_workout' | 'smart_regenerate';
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
  const { coachName, coachPersonality, loadCoachSettings, getPersonalityTone, setCoachPersonality } = useCoachStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Load coach settings on mount
  useEffect(() => {
    loadCoachSettings();
  }, []);
  
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
    
    const lowerMessage = message.toLowerCase();
    
    // STRICT fitness-only filter - Must contain fitness-related content
    const fitnessKeywords = [
      // Workout terms
      'workout', 'exercise', 'fitness', 'gym', 'training', 'muscle', 'cardio', 'strength',
      'weight', 'rep', 'set', 'routine', 'schedule', 'body', 'chest', 'legs', 'arms',
      'back', 'core', 'abs', 'run', 'jog', 'walk', 'swim', 'bike', 'yoga', 'pilates', 'squat',
      'bench', 'deadlift', 'press', 'curl', 'pull', 'push', 'lunge', 'plank', 'burpee', 'hiit',
      // Nutrition terms
      'nutrition', 'diet', 'protein', 'calories', 'carbs', 'food', 'meal', 'supplement', 'hydration',
      'water', 'eat', 'eating', 'macros', 'fasting', 'bulk', 'cut', 'lean',
      // Health terms
      'health', 'injury', 'pain', 'stretch', 'rest', 'recovery', 'sleep', 'stress', 'energy',
      // Intensity and progress
      'intense', 'light', 'heavy', 'form', 'technique', 'tired', 'motivation', 'goal',
      'progress', 'beginner', 'advanced', 'intermediate', 'tone', 'fat', 'gain',
      // Schedule terms
      'today', 'tomorrow', 'week', 'day', 'swap', 'switch', 'change', 'modify', 'adjust',
      // Coach interaction
      'help', 'tips', 'advice', 'recommend', 'suggest', 'how', 'what', 'should',
    ];
    
    // Check for greetings and basic interaction
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you'];
    const isGreeting = greetings.some(g => lowerMessage.includes(g));
    
    const hasFitnessKeyword = fitnessKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // If it's just a greeting, respond warmly
    if (isGreeting && lowerMessage.length < 30) {
      setIsLoading(false);
      addMessage(
        `Hey there! 💪 Great to see you!\n\nI'm your AI fitness coach, here to help with:\n• Your workout schedule\n• Exercise form and technique\n• Nutrition guidance\n• Fitness goals and motivation\n\nWhat can I help you with today?`,
        true
      );
      return;
    }
    
    // If NOT fitness-related, politely decline
    if (!hasFitnessKeyword && lowerMessage.length > 10) {
      setIsLoading(false);
      addMessage(
        `I appreciate you reaching out! However, I'm specifically trained to help with fitness, health, and nutrition topics only. 💪\n\nI can't help with questions about ${lowerMessage.split(' ').slice(0, 3).join(' ')}..., but I'd love to help you with:\n\n• Your workouts and training plans\n• Exercise form and technique\n• Nutrition and meal planning\n• Recovery and injury prevention\n• Fitness goals and motivation\n\nWhat fitness topic can I assist you with?`,
        true
      );
      return;
    }
    
    // Try to get user ID for personalized response
    let userId: number | undefined;
    try {
      const storedUser = await SecureStore.getItemAsync('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        userId = user.id;
      }
    } catch (e) {
      console.log('Could not get user ID for coach chat');
    }
    
    // Check for local action intents first (swap days, etc.)
    if (lowerMessage.includes('swap') || lowerMessage.includes('switch')) {
      if (lowerMessage.includes('wednesday') && lowerMessage.includes('thursday')) {
        setIsLoading(false);
        addMessage(
          "Got it! You want to swap Wednesday and Thursday workouts. 📅\n\nWednesday's workout will move to Thursday, and Thursday's will move to Wednesday.\n\nShall I make this swap?",
          true,
          { type: 'swap_days', params: { from: 2, to: 3 }, label: 'Swap Wed ↔ Thu' }
        );
        return;
      } else if (lowerMessage.includes('today') && lowerMessage.includes('tomorrow')) {
        const today = new Date().getDay();
        const todayIndex = today === 0 ? 6 : today - 1;
        const tomorrowIndex = (todayIndex + 1) % 7;
        setIsLoading(false);
        addMessage(
          "I can swap today's workout with tomorrow's. 📅\n\nThis will move your current workout to tomorrow.\n\nWant me to do this?",
          true,
          { type: 'swap_days', params: { from: todayIndex, to: tomorrowIndex }, label: 'Swap Today ↔ Tomorrow' }
        );
        return;
      }
    }
    
    // Detect intensity change locally
    if (lowerMessage.includes('more intense') || lowerMessage.includes('harder') || lowerMessage.includes('challenging')) {
      setIsLoading(false);
      addMessage(
        "Let's crank up the intensity! 🔥\n\nFor today's workout, I can:\n• Add supersets\n• Reduce rest periods\n• Add extra sets\n• Include a finisher circuit\n\nYour workout will be regenerated with higher intensity. Ready?",
        true,
        { type: 'change_intensity', params: { level: 'high' }, label: 'Increase Intensity' }
      );
      return;
    }
    
    // Detect shorter workout locally
    if (lowerMessage.includes('short') || lowerMessage.includes('quick') || lowerMessage.includes('30 min') || lowerMessage.includes('less time')) {
      setIsLoading(false);
      addMessage(
        "Got it! Let me optimize your workout for time. ⏱️\n\nI'll:\n• Focus on compound movements\n• Use supersets to save time\n• Keep you moving with minimal rest\n\nYour workout will be ~30 minutes. Sound good?",
        true,
        { type: 'modify_workout', params: { duration: 30 }, label: 'Make It Quick' }
      );
      return;
    }
    
    // Detect regenerate intent locally
    if (lowerMessage.includes('new workout') || lowerMessage.includes('regenerate') || lowerMessage.includes('different workout')) {
      setIsLoading(false);
      addMessage(
        "Fresh workout coming up! 💪\n\nI'll generate a brand new workout targeting the same muscle groups but with different exercises and structure.\n\nReady to regenerate?",
        true,
        { type: 'regenerate', label: 'Generate New Workout' }
      );
      return;
    }
    
    // SMART INJURY/PREFERENCE DETECTION - Only regenerate affected workouts
    const injuryKeywords = ['injury', 'injured', 'hurt', 'pain', 'sore', 'strain', 'sprain', 'pulled', 'torn', 'ache', 'aching'];
    const bodyPartKeywords = {
      lower: ['knee', 'leg', 'ankle', 'hip', 'foot', 'hamstring', 'quad', 'calf', 'glute', 'lower back'],
      upper: ['shoulder', 'arm', 'wrist', 'elbow', 'chest', 'neck', 'upper back', 'tricep', 'bicep'],
      core: ['back', 'spine', 'ab', 'core', 'stomach'],
    };
    
    const hasInjuryKeyword = injuryKeywords.some(k => lowerMessage.includes(k));
    
    if (hasInjuryKeyword) {
      // Determine which body area is affected
      let affectedArea = '';
      let affectedWorkouts: string[] = [];
      
      for (const [area, keywords] of Object.entries(bodyPartKeywords)) {
        if (keywords.some(k => lowerMessage.includes(k))) {
          affectedArea = area;
          break;
        }
      }
      
      if (affectedArea === 'lower') {
        affectedWorkouts = ['Leg Day', 'Lower Body', 'Running', 'Cardio', 'HIIT'];
      } else if (affectedArea === 'upper') {
        affectedWorkouts = ['Upper Body', 'Push Day', 'Pull Day', 'Chest Day', 'Back Day', 'Arm Day'];
      } else if (affectedArea === 'core') {
        affectedWorkouts = ['Core', 'Ab workout', 'Full Body'];
      }
      
      setIsLoading(false);
      
      if (affectedArea) {
        addMessage(
          `Oh no, I'm sorry to hear that! 😔 Let me help you work around this.\n\nBased on your ${affectedArea} issue, I can:\n\n• Modify your ${affectedWorkouts.slice(0, 2).join(' and ')} workouts to avoid aggravating it\n• Substitute exercises with safer alternatives\n• Keep your other workouts (like ${affectedArea === 'lower' ? 'Upper Body days' : 'Leg days'}) unchanged\n\nI'll only update the affected workout days - not your entire program. Would you like me to adjust your plan?`,
          true,
          { 
            type: 'smart_regenerate', 
            params: { 
              affectedArea, 
              affectedWorkouts,
              reason: 'injury'
            }, 
            label: `Update ${affectedArea.charAt(0).toUpperCase() + affectedArea.slice(1)} Workouts` 
          }
        );
      } else {
        addMessage(
          `I'm sorry to hear you're dealing with an injury! 😔\n\nCan you tell me which body part is affected? For example:\n• Knee, leg, or lower body\n• Shoulder, arm, or upper body\n• Back or core\n\nOnce I know, I'll only update the relevant workout days while keeping everything else the same.`,
          true
        );
      }
      return;
    }
    
    // Detect preference changes (equipment, style changes)
    const preferenceKeywords = ['no equipment', 'home workout', 'gym only', 'bodyweight', 'dumbbells only', 'no running', 'hate cardio', 'prefer', 'want more', 'want less', 'focus on'];
    const hasPreferenceChange = preferenceKeywords.some(k => lowerMessage.includes(k));
    
    if (hasPreferenceChange) {
      setIsLoading(false);
      addMessage(
        `Got it! I'll note that preference. 📝\n\nWould you like me to update your workout plan to reflect this change?\n\nI'll only adjust the workouts that are affected - your other days will stay the same.`,
        true,
        { 
          type: 'smart_regenerate', 
          params: { 
            preference: message,
            reason: 'preference'
          }, 
          label: 'Update Affected Workouts' 
        }
      );
      return;
    }
    
    // For all other fitness-related questions, call the backend API for personalized response
    try {
      const personalityTone = getPersonalityTone();
      
      const response = await fetch(`${API_BASE_URL}/api/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          message,
          coach: coachName,
          coachPersonality: coachPersonality,
          personalityTone: personalityTone,
          trainingType: currentWorkout?.type,
          userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      // Check if user wants to change coach personality
      if (lowerMessage.includes('change') && (lowerMessage.includes('style') || lowerMessage.includes('personality') || lowerMessage.includes('coach'))) {
        if (lowerMessage.includes('aggressive')) {
          setCoachPersonality('aggressive');
          addMessage(`Got it! I'll be more intense and pushing from now on. Let's crush it! 💪🔥`, true);
          setIsLoading(false);
          return;
        } else if (lowerMessage.includes('friendly')) {
          setCoachPersonality('friendly');
          addMessage(`Sure thing! I'll be more supportive and encouraging. You've got this! 😊`, true);
          setIsLoading(false);
          return;
        } else if (lowerMessage.includes('disciplined')) {
          setCoachPersonality('disciplined');
          addMessage(`Understood. I'll be more structured and focused. Let's stay on track.`, true);
          setIsLoading(false);
          return;
        } else if (lowerMessage.includes('motivational')) {
          setCoachPersonality('motivational');
          addMessage(`Yes! I'll bring the inspiration and energy! You're unstoppable! 🌟`, true);
          setIsLoading(false);
          return;
        }
      }
      
      setIsLoading(false);
      addMessage(data.response || "I'm here to help! What would you like to know about your fitness journey?", true);
      
    } catch (error) {
      console.error('Error calling coach API:', error);
      
      // Fallback to local response if API fails
      setIsLoading(false);
      
      // Detect rest day intent locally
      if (lowerMessage.includes('rest') || lowerMessage.includes('skip') || lowerMessage.includes('day off')) {
        addMessage(
          "Taking a rest day is totally fine! 😌 Recovery is important.\n\nI can:\n1. Mark today as a rest day\n2. Move today's workout to another day\n\nWhat would you prefer?",
          true
        );
        return;
      }
      
      // Detect form/tips locally
      if (lowerMessage.includes('form') || lowerMessage.includes('tip') || lowerMessage.includes('how to')) {
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
        return;
      }
      
      // Generic helpful response
      addMessage(
        "I can help with that! 🤔\n\nHere's what I can do:\n• Swap workout days\n• Adjust workout intensity\n• Make workouts shorter/longer\n• Give form tips\n• Regenerate today's workout\n\nTry asking specifically what you need!",
        true
      );
    }
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
          
        case 'smart_regenerate':
          // Smart regeneration - only update affected workouts
          const { affectedArea, affectedWorkouts, reason, preference } = action.params || {};
          
          // Save the user's condition to AI learning context
          try {
            const learningData = {
              type: reason === 'injury' ? 'injury_note' : 'preference_change',
              affectedArea,
              affectedWorkouts,
              preference,
              timestamp: new Date().toISOString(),
            };
            await AsyncStorage.setItem('ai_condition_context', JSON.stringify(learningData));
          } catch (e) {
            console.log('Could not save learning context');
          }
          
          // Only regenerate affected days (simulated for now)
          // In production, this would call a smarter API endpoint
          await forceRegenerateWeek();
          
          if (reason === 'injury') {
            addMessage(
              `Done! ✅ I've updated your ${affectedArea} workouts to work around your condition.\n\n` +
              `• Modified exercises that stress the affected area\n` +
              `• Added alternatives and mobility work\n` +
              `• Your other workouts remain unchanged\n\n` +
              `Take care and listen to your body! 💪`,
              true
            );
          } else {
            addMessage(
              `Done! ✅ I've adjusted the relevant workouts based on your preference.\n\n` +
              `Your other workout days haven't been changed. Let me know if you need anything else!`,
              true
            );
          }
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
                <Text style={styles.headerTitle}>{coachName}</Text>
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
