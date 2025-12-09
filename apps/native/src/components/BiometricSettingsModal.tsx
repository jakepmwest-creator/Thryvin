import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from './CustomAlert';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
};

interface BiometricSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BiometricSettingsModal = ({ visible, onClose }: BiometricSettingsModalProps) => {
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    checkBiometricSupport();
    loadSettings();
  }, [visible]);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setHasBiometrics(hasHardware && isEnrolled);

      // Determine biometric type
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
      } else {
        setBiometricType('Biometrics');
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
      setHasBiometrics(false);
    } finally {
      setIsChecking(false);
    }
  };

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometrics_enabled');
      setBiometricsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleBiometrics = async () => {
    if (!hasBiometrics) {
      showAlert('warning', 'Biometrics Not Available', `${biometricType} is not set up on this device. Please enable it in your device settings first.`);
      return;
    }

    if (!biometricsEnabled) {
      // Enable biometrics - verify first
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType} for Thryvin`,
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setBiometricsEnabled(true);
          await AsyncStorage.setItem('biometrics_enabled', 'true');
          showAlert('success', 'Success! 🎉', `${biometricType} has been enabled for quick login.`);
        }
      } catch (error) {
        showAlert('error', 'Error', 'Failed to enable biometrics. Please try again.');
      }
    } else {
      // Disable biometrics
      showAlert('warning', 'Disable Biometrics', `Are you sure you want to disable ${biometricType}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            setBiometricsEnabled(false);
            await AsyncStorage.setItem('biometrics_enabled', 'false');
          },
        },
      ]);
    }
  };

  const getIcon = () => {
    if (biometricType === 'Face ID') return 'scan-outline';
    if (biometricType.includes('Touch') || biometricType.includes('Fingerprint')) return 'finger-print';
    return 'lock-closed';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Custom Alert */}
          <CustomAlert
            visible={alertConfig.visible}
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            onClose={hideAlert}
          />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.title}>Biometric Login</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.content}>
            {/* Icon Display */}
            <View style={styles.iconContainer}>
              <Ionicons name={getIcon() as any} size={64} color={COLORS.accent} />
            </View>

            <Text style={styles.description}>
              Use {biometricType} for quick and secure access to Thryvin
            </Text>

            {/* Status */}
            {!hasBiometrics && !isChecking && (
              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={20} color="#FF9500" />
                <Text style={styles.warningText}>
                  {biometricType} is not available or not set up on this device.
                </Text>
              </View>
            )}

            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Ionicons name={getIcon() as any} size={24} color={COLORS.accent} />
                <View>
                  <Text style={styles.toggleTitle}>Enable {biometricType}</Text>
                  <Text style={styles.toggleSubtitle}>
                    {biometricsEnabled ? 'Quick login is active' : 'Use your face or fingerprint to login'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ false: COLORS.lightGray, true: `${COLORS.accent}40` }}
                thumbColor={biometricsEnabled ? COLORS.accent : COLORS.mediumGray}
                disabled={!hasBiometrics && !biometricsEnabled}
              />
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.infoText}>
                Your biometric data never leaves your device. We only store a secure confirmation that you've authenticated.
              </Text>
            </View>

            {/* Additional Options */}
            <View style={styles.optionsSection}>
              <Text style={styles.optionsSectionTitle}>When to use {biometricType}</Text>
              
              <View style={styles.optionItem}>
                <Ionicons name="log-in" size={20} color={COLORS.accent} />
                <Text style={styles.optionText}>App launch login</Text>
                <Ionicons name="checkmark-circle" size={20} color={biometricsEnabled ? COLORS.success : COLORS.lightGray} />
              </View>
              
              <View style={styles.optionItem}>
                <Ionicons name="eye-off" size={20} color={COLORS.accent} />
                <Text style={styles.optionText}>View sensitive data</Text>
                <Ionicons name="checkmark-circle" size={20} color={biometricsEnabled ? COLORS.success : COLORS.lightGray} />
              </View>
            </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.success}10`,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  optionsSection: {
    width: '100%',
  },
  optionsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
});
