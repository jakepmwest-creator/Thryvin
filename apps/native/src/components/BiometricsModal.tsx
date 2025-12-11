import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface BiometricsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BiometricsModal = ({ visible, onClose, onSuccess }: BiometricsModalProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      checkBiometrics();
    }
  }, [visible]);

  const checkBiometrics = async () => {
    try {
      // Check if hardware supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsSupported(compatible);

      if (compatible) {
        // Check what types are available
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('facial');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('iris');
        }

        // Check if user has enrolled biometrics
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);
      }
    } catch (err) {
      console.error('Error checking biometrics:', err);
      setError('Could not check biometric availability');
    }
  };

  const authenticateWithBiometrics = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        // Save biometric preference
        await AsyncStorage.setItem('biometrics_enabled', 'true');
        onSuccess();
        onClose();
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled, just close
        } else if (result.error === 'user_fallback') {
          setError('Please set up a PIN first for fallback authentication');
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      setError('Authentication error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'facial':
        return 'scan-outline';
      case 'fingerprint':
        return 'finger-print';
      case 'iris':
        return 'eye-outline';
      default:
        return 'shield-checkmark-outline';
    }
  };

  const getBiometricName = () => {
    switch (biometricType) {
      case 'facial':
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case 'fingerprint':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case 'iris':
        return 'Iris Scanner';
      default:
        return 'Biometrics';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
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
              <View style={styles.iconContainer}>
                <Ionicons name={getBiometricIcon()} size={40} color={COLORS.white} />
              </View>
              <Text style={styles.headerTitle}>{getBiometricName()}</Text>
              <Text style={styles.headerSubtitle}>
                Quick and secure login with biometrics
              </Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {!isSupported ? (
              // Not Supported
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, styles.errorIcon]}>
                  <Ionicons name="close-circle" size={48} color={COLORS.error} />
                </View>
                <Text style={styles.statusTitle}>Not Available</Text>
                <Text style={styles.statusText}>
                  Your device doesn't support biometric authentication.
                </Text>
              </View>
            ) : !isEnrolled ? (
              // Not Enrolled
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, styles.warningIcon]}>
                  <Ionicons name="alert-circle" size={48} color="#FF9500" />
                </View>
                <Text style={styles.statusTitle}>Setup Required</Text>
                <Text style={styles.statusText}>
                  You haven't set up {getBiometricName()} on your device yet.{'\n\n'}
                  Go to your device settings to enroll your {biometricType === 'facial' ? 'face' : 'fingerprint'}, 
                  then come back here to enable it for Thryvin.
                </Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                  <Text style={styles.secondaryButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Ready to Enable
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, styles.successIcon]}>
                  <Ionicons name={getBiometricIcon()} size={48} color={COLORS.accent} />
                </View>
                <Text style={styles.statusTitle}>Ready to Enable</Text>
                <Text style={styles.statusText}>
                  Use {getBiometricName()} for quick and secure access to Thryvin.{'\n\n'}
                  Tap the button below and authenticate to enable.
                </Text>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <TouchableOpacity 
                  style={styles.enableButton}
                  onPress={authenticateWithBiometrics}
                  disabled={isAuthenticating}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.enableButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={getBiometricIcon()} size={24} color={COLORS.white} />
                    <Text style={styles.enableButtonText}>
                      {isAuthenticating ? 'Authenticating...' : `Enable ${getBiometricName()}`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    backgroundColor: `${COLORS.accent}15`,
  },
  errorIcon: {
    backgroundColor: `${COLORS.error}15`,
  },
  warningIcon: {
    backgroundColor: '#FF950015',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  enableButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  enableButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  enableButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    color: COLORS.mediumGray,
  },
});
