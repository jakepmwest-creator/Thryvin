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

export function FloatingCoachButton() {
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm your AI coach. Ask me anything about workouts, nutrition, or how to crush your goals!" },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const aiResponse = await callOpenAI(userMessage);
    
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    setIsLoading(false);
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
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask your coach anything..."
                placeholderTextColor={COLORS.mediumGray}
                value={inputText}
                onChangeText={setInputText}
                multiline
                editable={!isLoading}
              />
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
                  <Ionicons name="send" size={20} color={COLORS.white} />
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
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 10,
  },
  input: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});