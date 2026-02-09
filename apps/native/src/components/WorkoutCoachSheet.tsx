/**
 * WorkoutCoachSheet - In-Workout AI Coach Bottom Sheet
 * 
 * Phase 8: Floating AI Coach inside Workout Hub
 * 
 * Features:
 * - Bottom sheet that slides up when tapped
 * - Chat interface with message history
 * - Quick prompt chips for common questions
 * - Workout context-aware responses
 * - Voice input support (if available)
 * 
 * IMPORTANT: All AI calls go through backend /api/coach/chat endpoint
 * Frontend NEVER calls OpenAI directly
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../services/env';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

const API_BASE_URL = getApiBaseUrl();

const COLORS = {
  primary: '#A22BF6',
  secondary: '#FF4EC7',
  gradientStart: '#A22BF6',
  gradientEnd: '#FF4EC7',
  background: '#FFFFFF',
  cardBg: '#F5F5F7',
  text: '#1C1C1E',
  lightGray: '#E5E5EA',
  mediumGray: '#8E8E93',
  darkGray: '#636366',
  success: '#34C759',
  white: '#FFFFFF',
};

// Quick prompt chips for workout-context coaching (Phase 8.5 - corrected)
const QUICK_PROMPTS = [
  { label: 'Weight?', prompt: 'What weight should I use?' },
  { label: 'Form tip', prompt: 'Give me a form tip' },
  { label: 'Rest time?', prompt: 'How long should I rest?' },
  { label: 'Swap', prompt: 'Swap this exercise' },
  { label: 'Easier', prompt: 'Make this easier' },
  { label: 'Reps?', prompt: 'How many reps should I aim for?' },
];

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

interface WorkoutContext {
  workoutId?: string;
  workoutTitle?: string;
  workoutType?: string;
  currentDay?: number;
  currentWeek?: number;
  currentExercise?: {
    id?: string;
    name: string;
    sets?: number;
    reps?: number | string;
    restTime?: number;
    userLoggedSets?: number;
    lastEnteredWeight?: number;
    lastEnteredReps?: number;
  };
  remainingExercisesCount?: number;
  progressPercent?: number;
  userIntentHint?: 'in_workout' | 'planning' | 'review';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  workoutContext: WorkoutContext;
  coachName?: string;
}

export function WorkoutCoachSheet({ visible, onClose, workoutContext, coachName = 'Titan' }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Animation for sheet slide
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for typing indicator
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Animate sheet open/close
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Add welcome message if no messages yet
      if (messages.length === 0) {
        const exerciseName = workoutContext.currentExercise?.name || 'your workout';
        setMessages([{
          id: 'welcome',
          role: 'coach',
          content: `Hey! I'm here to help with ${exerciseName}. Ask me anything about weight, form, or alternatives. 💪`,
          timestamp: new Date(),
        }]);
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Typing indicator animation
  useEffect(() => {
    if (isLoading) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      
      animateDot(typingDot1, 0);
      animateDot(typingDot2, 150);
      animateDot(typingDot3, 300);
    } else {
      typingDot1.setValue(0);
      typingDot2.setValue(0);
      typingDot3.setValue(0);
    }
  }, [isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      
      // Build conversation history for context (last 12 messages)
      const conversationHistory = messages.slice(-12).map(m => ({
        role: m.role === 'coach' ? 'assistant' : 'user',
        content: m.content,
      }));
      
      // IMPORTANT: Call backend endpoint, NOT OpenAI directly
      const response = await fetch(`${API_BASE_URL}/api/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        credentials: 'include', // Required for session cookies
        body: JSON.stringify({
          message: text.trim(),
          coach: coachName.toLowerCase(),
          conversationHistory,
          workoutContext: {
            ...workoutContext,
            userIntentHint: 'in_workout', // Tell backend we're mid-workout
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      const coachMessage: Message = {
        id: `coach-${Date.now()}`,
        role: 'coach',
        content: data.response || "I'm here to help! Try asking about weight, form, or exercise alternatives.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, coachMessage]);
      setIsOnline(true);
    } catch (error) {
      console.error('Coach chat error:', error);
      setIsOnline(false);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'coach',
        content: "Having trouble connecting. Check your connection and try again. 💪",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    // Auto-contextualize the prompt with current exercise
    let contextualizedPrompt = prompt;
    if (workoutContext.currentExercise?.name) {
      if (prompt.includes('this exercise')) {
        contextualizedPrompt = prompt.replace('this exercise', workoutContext.currentExercise.name);
      } else if (prompt.includes('Weight?') || prompt.includes('weight should I use')) {
        contextualizedPrompt = `What weight should I use for ${workoutContext.currentExercise.name}?`;
      }
    }
    sendMessage(contextualizedPrompt);
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }
        ]}
      >
        <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} activeOpacity={1} />
      </Animated.View>
      
      {/* Bottom Sheet */}
      <Animated.View 
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.coachAvatar}
              >
                <Ionicons name="fitness" size={18} color={COLORS.white} />
              </LinearGradient>
              <View style={styles.headerInfo}>
                <View style={styles.headerNameRow}>
                  <Text style={styles.coachName}>{coachName}</Text>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.mediumGray }]} />
                </View>
                <Text style={styles.headerSubtitle}>Workout Coach</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>
          
          {/* Current exercise context */}
          {workoutContext.currentExercise && (
            <View style={styles.contextBar}>
              <Ionicons name="barbell-outline" size={14} color={COLORS.primary} />
              <Text style={styles.contextText} numberOfLines={1}>
                {workoutContext.currentExercise.name}
              </Text>
              {workoutContext.progressPercent !== undefined && (
                <Text style={styles.progressText}>{workoutContext.progressPercent}% done</Text>
              )}
            </View>
          )}
          
          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.coachBubble
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.coachText
                ]}>
                  {message.content}
                </Text>
              </View>
            ))}
            
            {/* Typing indicator */}
            {isLoading && (
              <View style={[styles.messageBubble, styles.coachBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
                  <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
                  <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
                </View>
              </View>
            )}
          </ScrollView>
          
          {/* Quick prompts */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickPromptsContainer}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {QUICK_PROMPTS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPromptChip}
                onPress={() => handleQuickPrompt(item.prompt)}
                disabled={isLoading}
              >
                <Text style={styles.quickPromptText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Input area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask your coach..."
                placeholderTextColor={COLORS.mediumGray}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={() => sendMessage(inputText)}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  keyboardView: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    gap: 2,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + '10',
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: COLORS.white,
  },
  coachText: {
    color: COLORS.text,
  },
  typingBubble: {
    paddingVertical: 14,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.mediumGray,
  },
  quickPromptsContainer: {
    maxHeight: 44,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  quickPromptsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  quickPromptChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  quickPromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
});

export default WorkoutCoachSheet;
