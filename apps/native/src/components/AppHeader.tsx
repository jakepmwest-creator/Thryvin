import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useSubscriptionStore } from '../stores/subscription-store';

interface AppHeaderProps {
  mode?: 'fitness' | 'nutrition';
}

const COLORS = {
  fitnessAccent: '#A22BF6',
  fitnessSecondary: '#FF4EC7',
  nutritionAccent: '#4CAF50',
  text: '#222222',
  white: '#ffffff',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
};

// Nice "Coming Soon" Modal Component
const ComingSoonModal = ({ 
  visible, 
  onClose, 
  title, 
  message, 
  icon 
}: { 
  visible: boolean; 
  onClose: () => void; 
  title: string; 
  message: string; 
  icon: string;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity 
      style={comingSoonStyles.overlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={comingSoonStyles.container}>
        <LinearGradient
          colors={[COLORS.fitnessAccent, COLORS.fitnessSecondary]}
          style={comingSoonStyles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={40} color={COLORS.white} />
        </LinearGradient>
        
        <Text style={comingSoonStyles.title}>{title}</Text>
        <Text style={comingSoonStyles.message}>{message}</Text>
        
        <TouchableOpacity onPress={onClose} style={comingSoonStyles.buttonWrapper}>
          <LinearGradient
            colors={[COLORS.fitnessAccent, COLORS.fitnessSecondary]}
            style={comingSoonStyles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={comingSoonStyles.buttonText}>Got it!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

const comingSoonStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export function AppHeader({ mode = 'fitness' }: AppHeaderProps) {
  const router = useRouter();
  const [showSocialModal, setShowSocialModal] = useState(false);
  const { isPro } = useSubscriptionStore();
  const accentColor = mode === 'fitness' ? COLORS.fitnessAccent : COLORS.nutritionAccent;

  // PRIORITY 2: 7-tap counter for diagnostics screen access
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    
    // Reset counter after 3 seconds of no taps
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 3000);
    
    // Navigate to diagnostics after 7 taps
    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      router.push('/diagnostics');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo and PRO badge - 7 taps opens diagnostics */}
      <TouchableOpacity style={styles.leftSection} onPress={handleLogoTap} activeOpacity={0.9}>
        <Image
          source={require('../../assets/images/thryvin-logo-final.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {isPro && (
          <LinearGradient
            colors={[COLORS.fitnessAccent, COLORS.fitnessSecondary]}
            style={styles.proBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.proText}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Right buttons */}
      <View style={styles.rightSection}>
        {/* Social Button - Now shows Coming Soon */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: COLORS.lightGray }]}
          onPress={() => setShowSocialModal(true)}
        >
          <Ionicons name="people-outline" size={22} color={accentColor} />
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: COLORS.lightGray }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="person-outline" size={22} color={accentColor} />
        </TouchableOpacity>
      </View>
      
      {/* Coming Soon Modal for Social */}
      <ComingSoonModal
        visible={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        title="Social Coming Soon! 👥"
        message="We're building something awesome! Connect with workout buddies, share achievements, and compete on leaderboards - coming in a future update!"
        icon="people"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 100,
    height: 30,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
