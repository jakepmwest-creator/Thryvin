import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
  mode?: 'fitness' | 'nutrition';
}

const COLORS = {
  fitnessAccent: '#a259ff',
  nutritionAccent: '#4CAF50',
  text: '#222222',
  white: '#ffffff',
  lightGray: '#F8F9FA',
};

export function AppHeader({ mode = 'fitness' }: AppHeaderProps) {
  const router = useRouter();
  const accentColor = mode === 'fitness' ? COLORS.fitnessAccent : COLORS.nutritionAccent;

  return (
    <View style={styles.container}>
      {/* Logo and PRO badge */}
      <View style={styles.leftSection}>
        <Image
          source={require('../../assets/images/thryvin-logo-final.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={[styles.proBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.proText}>PRO</Text>
        </View>
      </View>

      {/* Right buttons */}
      <View style={styles.rightSection}>
        {/* Social Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: COLORS.lightGray }]}
          onPress={() => {
            console.log('NAVIGATING TO SOCIAL');
            router.push('/(tabs)/social');
          }}
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
