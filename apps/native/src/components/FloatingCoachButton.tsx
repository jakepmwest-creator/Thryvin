import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { VoiceInputButton } from './VoiceInputButton';
import { useWorkoutStore } from '../stores/workout-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart, // #A22BF6
  accentSecondary: THEME_COLORS.gradientEnd, // #FF4EC7
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
};

const BUTTON_SIZE = 60;
const EDGE_PADDING = 20;

// Get OpenAI API key from expo-constants
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;

// Log error if key is missing
if (!OPENAI_API_KEY) {
  console.error('Missing OpenAI API key. Please set EXPO_PUBLIC_OPENAI_API_KEY in .env file');
}

// Quick action chips for common requests
const QUICK_ACTIONS = [
  { icon: 'swap-horizontal', label: 'Swap days', prompt: 'I need to swap my workout days' },
  { icon: 'time', label: 'Shorter', prompt: 'Make my workout shorter today' },
  { icon: 'flame', label: 'Harder', prompt: 'I want a more intense workout' },
  { icon: 'refresh', label: 'New workout', prompt: 'Generate a new workout for today' },
];

export function FloatingCoachButton() {
  const { swapWorkoutDays, forceRegenerateWeek, weekWorkouts } = useWorkoutStore();
  
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm your AI coach. 💪 I can help with workouts, swap your training days, adjust intensity, or answer fitness questions!" },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; params?: any } | null>(null);

  const pan = useRef(new Animated.ValueXY({ 
    x: SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING, 
    y: SCREEN_HEIGHT - 200 
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isSignificantMove = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        if (isSignificantMove) {
          setIsDragging(true);
        }
        return isSignificantMove;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        const currentX = pan.x._value;
        const currentY = pan.y._value;
        
        const finalX = Math.max(
          EDGE_PADDING,
          Math.min(currentX, SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING)
        );
        const finalY = Math.max(
          100,
          Math.min(currentY, SCREEN_HEIGHT - BUTTON_SIZE - 100)
        );
        
        const snapX = finalX < SCREEN_WIDTH / 2 
          ? EDGE_PADDING 
          : SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING;
        
        Animated.spring(pan, {
          toValue: { x: snapX, y: finalY },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();

        setTimeout(() => setIsDragging(false), 100);
      },
    })
  ).current;

  const handleButtonPress = () => {
    if (!isDragging) {
      setChatVisible(true);
    }
  };

  const callOpenAI = async (userMessage: string) => {
    // Check if API key exists
    if (!OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return "🔑 OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an enthusiastic and knowledgeable AI fitness coach for the Thryvin app. You help users with workout advice, nutrition tips, motivation, and can modify their workout plans. Keep responses concise, encouraging, and actionable. Use emojis occasionally to keep it fun.'
            },
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API Error:', data.error);
        throw new Error(data.error.message);
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI Error:', error);
      return `I'm having trouble connecting right now. ${error?.message || 'Please try again in a moment!'} 💪`;
    }
  };

  // Detect workout intents and handle locally
  const detectWorkoutIntent = (message: string): { handled: boolean; response?: string; action?: { type: string; params?: any } } => {
    const lower = message.toLowerCase();
    
    // Swap days intent
    if (lower.includes('swap') || lower.includes('switch') || lower.includes('move')) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayMap: Record<string, number> = { 
        monday: 0, tuesday: 1, wednesday: 2, thursday: 3, 
        friday: 4, saturday: 5, sunday: 6,
        mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6
      };
      
      // Find mentioned days
      const mentionedDays: number[] = [];
      for (const [key, index] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          mentionedDays.push(index);
        }
      }
      
      // Check for "today" and "tomorrow"
      if (lower.includes('today')) {
        const today = new Date().getDay();
        mentionedDays.push(today === 0 ? 6 : today - 1);
      }
      if (lower.includes('tomorrow')) {
        const today = new Date().getDay();
        const tomorrow = today === 6 ? 0 : today;
        mentionedDays.push(tomorrow);
      }
      
      if (mentionedDays.length >= 2) {
        const [from, to] = mentionedDays;
        return {
          handled: true,
          response: `Got it! I'll swap those workout days for you. 📅\n\nConfirm by tapping the button below, or just say "yes" to proceed!`,
          action: { type: 'swap', params: { from, to } }
        };
      } else {
        return {
          handled: true,
          response: "Which days would you like to swap? 📅\n\nTry saying: 'Swap Wednesday with Thursday' or 'Switch today and tomorrow'"
        };
      }
    }
    
    // Regenerate workout intent
    if (lower.includes('new workout') || lower.includes('regenerate') || lower.includes('different workout') || lower.includes('fresh workout')) {
      return {
        handled: true,
        response: "Sure! I'll generate a fresh workout for you. 💪\n\nThis will create new exercises while keeping your preferences.\n\nConfirm to regenerate?",
        action: { type: 'regenerate' }
      };
    }
    
    // Intensity change
    if (lower.includes('harder') || lower.includes('intense') || lower.includes('challenging')) {
      return {
        handled: true,
        response: "Let's crank up the intensity! 🔥\n\nI'll regenerate your workout with:\n• More sets\n• Shorter rest periods\n• Compound movements\n\nReady to make it harder?",
        action: { type: 'regenerate' }
      };
    }
    
    // Shorter workout
    if (lower.includes('shorter') || lower.includes('quick') || lower.includes('less time') || lower.includes('30 min')) {
      return {
        handled: true,
        response: "No problem! ⏱️ I'll create a quick but effective workout.\n\nUsing supersets and compound moves to maximize your time.\n\nShall I regenerate with a shorter duration?",
        action: { type: 'regenerate' }
      };
    }
    
    // Yes/confirm handling for pending action
    if (pendingAction && (lower === 'yes' || lower === 'confirm' || lower === 'do it' || lower === 'go ahead')) {
      return { handled: true, response: 'executing_action' };
    }
    
    return { handled: false };
  };
  
  // Execute pending action
  const executeAction = async (action: { type: string; params?: any }) => {
    try {
      switch (action.type) {
        case 'swap':
          if (action.params?.from !== undefined && action.params?.to !== undefined) {
            await swapWorkoutDays(action.params.from, action.params.to);
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: "Done! ✅ I've swapped your workout days. Check your schedule to see the changes!" 
            }]);
          }
          break;
        case 'regenerate':
          await forceRegenerateWeek();
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: "Done! ✅ Your workout has been regenerated with fresh exercises. Go crush it! 💪" 
          }]);
          break;
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Oops, something went wrong. 😓 Please try again!" 
      }]);
    }
    setPendingAction(null);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    // First check for workout intents
    const intentResult = detectWorkoutIntent(userMessage);
    
    if (intentResult.handled) {
      if (intentResult.response === 'executing_action' && pendingAction) {
        await executeAction(pendingAction);
      } else if (intentResult.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: intentResult.response! }]);
        if (intentResult.action) {
          setPendingAction(intentResult.action);
        }
      }
      setIsLoading(false);
      return;
    }
    
    // Otherwise, call OpenAI
    const aiResponse = await callOpenAI(userMessage);
    
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    setIsLoading(false);
  };

  // Handle quick action
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setInputText(action.prompt);
  };

  // Handle voice transcription
  const handleVoiceTranscription = (text: string) => {
    setInputText(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handleButtonPress}
          activeOpacity={0.9}
          style={styles.touchable}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubble-ellipses" size={26} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setChatVisible(false)}
          />
          
          <View style={styles.chatContainer}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.chatHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.coachInfo}>
                  <View style={styles.coachAvatar}>
                    <Ionicons name="sparkles" size={20} color={COLORS.accent} />
                  </View>
                  <View>
                    <Text style={styles.coachName}>AI Coach</Text>
                    <Text style={styles.coachStatus}>Online • Ready to help</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setChatVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.assistantIcon}>
                      <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator color={COLORS.accent} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
              
              {/* Action confirmation button */}
              {pendingAction && !isLoading && (
                <TouchableOpacity 
                  style={styles.confirmActionButton}
                  onPress={() => executeAction(pendingAction)}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.confirmActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.confirmActionText}>
                      {pendingAction.type === 'swap' ? 'Confirm Swap' : 'Confirm & Regenerate'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
            
            {/* Quick Actions */}
            {messages.length <= 2 && !isLoading && (
              <View style={styles.quickActionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {QUICK_ACTIONS.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickAction}
                      onPress={() => handleQuickAction(action)}
                    >
                      <Ionicons name={action.icon as any} size={16} color={COLORS.accent} />
                      <Text style={styles.quickActionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask your coach anything..."
                  placeholderTextColor={COLORS.mediumGray}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  editable={!isLoading}
                />
                <VoiceInputButton
                  onTranscription={handleVoiceTranscription}
                  size="small"
                  style={styles.inlineVoiceButton}
                />
              </View>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={isLoading || !inputText.trim()}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.sendGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="send" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 9999,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  buttonGradient: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  chatHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  coachStatus: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantIcon: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  assistantText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 8,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 24,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    minHeight: 44,
  },
  inlineVoiceButton: {
    marginRight: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});