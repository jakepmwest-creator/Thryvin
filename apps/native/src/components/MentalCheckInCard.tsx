// Phase 10: Mental Check-in Component
// Light, non-intrusive check-in from the coach perspective

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../stores/coach-store';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warmOrange: '#FF9500',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitness-tracker-792.preview.emergentagent.com';

export interface MentalCheckIn {
  id: string;
  trigger: string;
  message: string;
  action: 'ease_back' | 'reset_plan' | 'lighter_sessions' | 'chat' | 'dismiss';
  actionLabel: string;
}

interface MentalCheckInCardProps {
  checkIn: MentalCheckIn;
  onAction: (action: string) => void;
  onDismiss: () => void;
  onSnooze: (days: number) => void;
}

export const MentalCheckInCard: React.FC<MentalCheckInCardProps> = ({
  checkIn,
  onAction,
  onDismiss,
  onSnooze,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  const { openChat } = useCoachStore();
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleMainAction = useCallback(() => {
    if (checkIn.action === 'chat') {
      openChat(checkIn.message);
    }
    onAction(checkIn.action);
  }, [checkIn, onAction, openChat]);
  
  const handleDismiss = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [fadeAnim, onDismiss]);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFF9E6', '#FFF5D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="heart-outline" size={20} color={COLORS.warmOrange} />
        </View>
        
        {/* Message */}
        <View style={styles.content}>
          <Text style={styles.message}>{checkIn.message}</Text>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.mainAction}
              onPress={handleMainAction}
              activeOpacity={0.7}
            >
              <Text style={styles.mainActionText}>{checkIn.actionLabel}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowOptions(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Dismiss X */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsSheet}>
            <Text style={styles.optionsTitle}>Check-in Options</Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                onSnooze(3);
              }}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Snooze for 3 days</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                onSnooze(7);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Snooze for 1 week</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, styles.optionItemDanger]}
              onPress={() => {
                setShowOptions(false);
                onAction('disable');
              }}
            >
              <Ionicons name="notifications-off-outline" size={20} color="#FF3B30" />
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>
                Turn off check-ins
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};

// Hook to fetch mental check-in eligibility
export function useMentalCheckIn() {
  const [checkIn, setCheckIn] = useState<MentalCheckIn | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchCheckIn = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/coach/mental-checkin?contextMode=home`,
        {
          headers: { 'Bypass-Tunnel-Reminder': 'true' },
          credentials: 'include',
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.eligible && data.checkIn) {
          setCheckIn(data.checkIn);
        } else {
          setCheckIn(null);
        }
      }
    } catch (error) {
      console.log('Could not fetch mental check-in');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const respondToCheckIn = useCallback(async (action: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/coach/mental-checkin/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      setCheckIn(null);
    } catch (error) {
      console.log('Could not respond to check-in');
    }
  }, []);
  
  const snoozeCheckIn = useCallback(async (days: number) => {
    const action = days === 3 ? 'snooze_3_days' : 'snooze_1_week';
    await respondToCheckIn(action);
  }, [respondToCheckIn]);
  
  const dismissCheckIn = useCallback(async () => {
    await respondToCheckIn('dismiss');
  }, [respondToCheckIn]);
  
  return {
    checkIn,
    loading,
    fetchCheckIn,
    respondToCheckIn,
    snoozeCheckIn,
    dismissCheckIn,
  };
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainAction: {
    backgroundColor: COLORS.warmOrange,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  mainActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  moreButton: {
    padding: 6,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionItemDanger: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
});

export default MentalCheckInCard;
