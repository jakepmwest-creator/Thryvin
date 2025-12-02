import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { CustomAlert } from './CustomAlert';

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
};

interface PINSetupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PINSetup({ visible, onClose, onSuccess }: PINSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  
  // Custom alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: typeof alertConfig.type, title: string, message: string, onAlertClose?: () => void) => {
    setAlertConfig({ visible: true, type, title, message, onClose: onAlertClose });
  };

  const hideAlert = () => {
    const callback = alertConfig.onClose;
    setAlertConfig(prev => ({ ...prev, visible: false }));
    if (callback) callback();
  };

  const handleNumberPress = (number: string) => {
    if (step === 'create' && pin.length < 6) {
      setPin(pin + number);
      if (pin.length + 1 === 6) {
        setTimeout(() => setStep('confirm'), 300);
      }
    } else if (step === 'confirm' && confirmPin.length < 6) {
      const newPin = confirmPin + number;
      setConfirmPin(newPin);
      
      if (newPin.length === 6) {
        if (newPin === pin) {
          savePIN(pin);
        } else {
          showAlert('error', 'PIN Mismatch', 'The PINs you entered do not match. Please try again.', () => {
            setPin('');
            setConfirmPin('');
            setStep('create');
          });
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const savePIN = async (pinCode: string) => {
    try {
      await SecureStore.setItemAsync('user_pin', pinCode);
      await SecureStore.setItemAsync('pin_enabled', 'true');
      showAlert('success', 'PIN Set! 🔐', 'Your PIN has been set successfully. You can now use it for quick access.', () => {
        onSuccess();
        resetModal();
      });
    } catch (error) {
      showAlert('error', 'Error', 'Could not save PIN. Please try again.');
    }
  };

  const resetModal = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
    onClose();
  };

  const renderDots = () => {
    const currentPin = step === 'create' ? pin : confirmPin;
    return (
      <View style={styles.dotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentPin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={resetModal}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>
              {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'create' 
                ? 'Enter a 6-digit PIN for quick access' 
                : 'Re-enter your PIN to confirm'}
            </Text>

            {/* PIN Dots */}
            {renderDots()}

            {/* Number Pad */}
            <View style={styles.numberPad}>
              {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']].map(
                (row, rowIndex) => (
                  <View key={rowIndex} style={styles.numberRow}>
                    {row.map((num) => {
                      if (num === '') {
                        return <View key="empty" style={styles.numberButton} />;
                      }
                      if (num === 'back') {
                        return (
                          <TouchableOpacity
                            key="back"
                            style={styles.numberButton}
                            onPress={handleBackspace}
                          >
                            <Ionicons name="backspace-outline" size={28} color={COLORS.text} />
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity
                          key={num}
                          style={styles.numberButton}
                          onPress={() => handleNumberPress(num)}
                        >
                          <Text style={styles.numberText}>{num}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: 'OK', style: 'default' }]}
        onClose={hideAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  dotFilled: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  numberPad: {
    gap: 16,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.text,
  },
});
