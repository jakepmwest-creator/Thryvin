import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  error: '#FF3B30',
};

interface PINSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
  isChangingPin?: boolean;
}

export const PINSetupModal = ({ visible, onClose, onComplete, isChangingPin = false }: PINSetupModalProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
  };

  const handleNumberPress = (num: string) => {
    setError('');
    
    if (step === 'enter') {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        
        if (newPin.length === 6) {
          // Move to confirm step
          setTimeout(() => {
            setStep('confirm');
            inputRef.current?.focus();
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + num;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 6) {
          // Verify PINs match
          if (newConfirmPin === pin) {
            onComplete(pin);
          } else {
            shakeAnimation();
            setError('PINs do not match. Try again.');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setPin('');
      setConfirmPin('');
      setError('');
    } else {
      onClose();
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;

  const renderDots = () => (
    <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <View 
          key={index} 
          style={[
            styles.dot,
            currentPin.length > index && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderNumberPad = () => (
    <View style={styles.numberPad}>
      {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']].map((row, rowIndex) => (
        <View key={rowIndex} style={styles.numberRow}>
          {row.map((num, numIndex) => {
            if (num === '') {
              return <View key={numIndex} style={styles.emptyButton} />;
            }
            if (num === 'back') {
              return (
                <TouchableOpacity 
                  key={numIndex} 
                  style={styles.numberButton}
                  onPress={handleBackspace}
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={28} color={COLORS.text} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity 
                key={numIndex} 
                style={styles.numberButton}
                onPress={() => handleNumberPress(num)}
                activeOpacity={0.7}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleBack}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name={step === 'confirm' ? "arrow-back" : "close"} size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={32} color={COLORS.white} />
              </View>
              <Text style={styles.headerTitle}>
                {isChangingPin ? 'Change PIN' : 'Set Up PIN'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {step === 'enter' 
                  ? 'Create a 6-digit PIN for quick login' 
                  : 'Re-enter your PIN to confirm'}
              </Text>
            </View>
          </LinearGradient>

          {/* PIN Display */}
          <View style={styles.pinSection}>
            <Text style={styles.stepText}>
              {step === 'enter' ? 'Enter your new PIN' : 'Confirm your PIN'}
            </Text>
            {renderDots()}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.hintText}>
                {step === 'enter' 
                  ? 'Choose a PIN you\'ll remember' 
                  : 'Enter the same PIN again'}
              </Text>
            )}
          </View>

          {/* Number Pad */}
          {renderNumberPad()}

          {/* Hidden input for keyboard (accessibility) */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={currentPin}
            onChangeText={(text) => {
              const numbers = text.replace(/[^0-9]/g, '');
              if (step === 'enter') {
                setPin(numbers);
                if (numbers.length === 6) {
                  setTimeout(() => {
                    setStep('confirm');
                    inputRef.current?.focus();
                  }, 200);
                }
              } else {
                setConfirmPin(numbers);
                if (numbers.length === 6) {
                  if (numbers === pin) {
                    onComplete(pin);
                  } else {
                    shakeAnimation();
                    setError('PINs do not match. Try again.');
                    setConfirmPin('');
                  }
                }
              }
            }}
          />
        </View>
      </View>
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
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 4,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  pinSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dotError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 8,
    fontWeight: '500',
  },
  numberPad: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButton: {
    width: 72,
    height: 72,
  },
  numberText: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
});
