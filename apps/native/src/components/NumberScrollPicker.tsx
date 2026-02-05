/**
 * NumberScrollPicker - iOS-style scroll wheel picker for weight/reps
 * 
 * Features:
 * - Scroll wheel selection with haptic feedback
 * - Can still type directly
 * - Thryvin purple gradient highlight
 * - Smooth animations
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const COLORS = {
  gradientStart: '#8B5CF6',
  gradientEnd: '#EC4899',
  background: '#0F0F1A',
  cardBg: '#1A1A2E',
  white: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B80',
};

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

interface NumberScrollPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: boolean;
  testId?: string;
  inputVariant?: 'light' | 'dark';
}

export const NumberScrollPicker = ({
  value,
  onValueChange,
  label,
  unit = '',
  min = 0,
  max = 500,
  step = 1,
  decimals = false,
  testId,
  inputVariant = 'dark',
}: NumberScrollPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const scrollRef = useRef<ScrollView>(null);
  const isLightInput = inputVariant === 'light';
  const inputIconColor = isLightInput ? '#9CA3AF' : COLORS.textMuted;
  const inputPlaceholderColor = isLightInput ? '#9CA3AF' : COLORS.textMuted;

  // Generate numbers for the picker
  const numbers: number[] = [];
  for (let i = min; i <= max; i += step) {
    numbers.push(decimals ? Math.round(i * 10) / 10 : i);
  }

  // Find current index
  const currentValue = parseFloat(value) || min;
  const currentIndex = numbers.findIndex(n => n >= currentValue);

  useEffect(() => {
    if (showPicker && scrollRef.current) {
      const scrollTo = Math.max(0, currentIndex) * ITEM_HEIGHT;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: scrollTo, animated: false });
      }, 100);
    }
  }, [showPicker, currentIndex]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const newValue = numbers[Math.max(0, Math.min(index, numbers.length - 1))];
    
    if (String(newValue) !== tempValue) {
      setTempValue(String(newValue));
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
    }
  };

  const handleConfirm = () => {
    onValueChange(tempValue);
    setShowPicker(false);
  };

  const handleDirectInput = (text: string) => {
    // Allow direct typing
    const cleaned = text.replace(/[^0-9.]/g, '');
    onValueChange(cleaned);
  };

  return (
    <>
      {/* Input field that opens picker */}
      <TouchableOpacity 
        style={[styles.inputContainer, isLightInput && styles.inputContainerLight]}
        onPress={() => {
          setTempValue(value || String(min));
          setShowPicker(true);
        }}
        activeOpacity={0.8}
        data-testid={testId ? `${testId}-trigger` : 'number-scroll-picker-trigger'}
      >
        <TextInput
          style={[styles.input, isLightInput && styles.inputTextLight]}
          value={value}
          onChangeText={handleDirectInput}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={inputPlaceholderColor}
          data-testid={testId ? `${testId}-text-input` : 'number-scroll-picker-text-input'}
        />
        <View style={styles.scrollIcon}>
          <Ionicons name="chevron-up" size={12} color={inputIconColor} />
          <Ionicons name="chevron-down" size={12} color={inputIconColor} style={{ marginTop: -4 }} />
        </View>
      </TouchableOpacity>

      {/* Scroll picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                data-testid={testId ? `${testId}-cancel-button` : 'number-scroll-picker-cancel-button'}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>{label}</Text>
              <TouchableOpacity
                onPress={handleConfirm}
                data-testid={testId ? `${testId}-done-button` : 'number-scroll-picker-done-button'}
              >
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.confirmButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Scroll picker */}
            <View style={styles.pickerWrapper}>
              {/* Selection highlight */}
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)']}
                style={styles.selectionHighlight}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              
              {/* Gradient overlays for fade effect */}
              <LinearGradient
                colors={[COLORS.cardBg, 'transparent']}
                style={styles.fadeTop}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['transparent', COLORS.cardBg]}
                style={styles.fadeBottom}
                pointerEvents="none"
              />

              <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScroll}
                onScrollEndDrag={handleScroll}
              >
                {/* Padding for centering */}
                <View style={{ height: ITEM_HEIGHT * 2 }} />
                
                {numbers.map((num, index) => {
                  const isSelected = String(num) === tempValue;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.pickerItem}
                      onPress={() => {
                        setTempValue(String(num));
                        scrollRef.current?.scrollTo({ 
                          y: index * ITEM_HEIGHT, 
                          animated: true 
                        });
                        if (Platform.OS === 'ios') {
                          Haptics.selectionAsync();
                        }
                      }}
                      data-testid={
                        testId ? `${testId}-option-${num}` : `number-scroll-picker-option-${num}`
                      }
                    >
                      <Text style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}>
                        {num}{unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                {/* Padding for centering */}
                <View style={{ height: ITEM_HEIGHT * 2 }} />
              </ScrollView>
            </View>

            {/* Quick select buttons */}
            <View style={styles.quickSelect}>
              {[5, 10, 15, 20, 25].map(preset => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.quickButton,
                    String(preset) === tempValue && styles.quickButtonActive,
                  ]}
                  onPress={() => {
                    setTempValue(String(preset));
                    const index = numbers.findIndex(n => n >= preset);
                    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                    if (Platform.OS === 'ios') {
                      Haptics.selectionAsync();
                    }
                  }}
                  data-testid={
                    testId ? `${testId}-quick-${preset}` : `number-scroll-picker-quick-${preset}`
                  }
                >
                  <Text style={[
                    styles.quickButtonText,
                    String(preset) === tempValue && styles.quickButtonTextActive,
                  ]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  pickerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Picker
  pickerWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    zIndex: 0,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 10,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: width - 40,
  },
  pickerItemText: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '700',
  },
  
  // Quick select
  quickSelect: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quickButtonActive: {
    backgroundColor: COLORS.gradientStart,
  },
  quickButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickButtonTextActive: {
    color: COLORS.white,
  },
});

export default NumberScrollPicker;
