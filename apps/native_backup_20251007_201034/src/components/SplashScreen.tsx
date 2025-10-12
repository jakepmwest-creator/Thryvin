import React from 'react';
import { View, StyleSheet } from 'react-native';
// Mock components for development
const ActivityIndicator = ({ size, color }: any) => (
  <View style={{ width: 40, height: 40, backgroundColor: color || '#7A3CF3', borderRadius: 20 }} />
);

const LinearGradient = ({ children, style, colors, ...props }: any) => (
  <View style={[{ backgroundColor: colors?.[0] || '#7A3CF3' }, style]} {...props}>
    {children}
  </View>
);

const SafeAreaView = ({ children, style }: any) => (
  <View style={[{ flex: 1, paddingTop: 40 }, style]}>{children}</View>
);

import { ThryvinLogo } from './ThryvinLogo';

const gradients = {
  primary: ['#7A3CF3', '#FF4FD8'],
};

export const SplashScreen = () => {
  return (
    <LinearGradient
      colors={gradients.primary}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.logoContainer}>
          <ThryvinLogo />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingBottom: 100,
  },
});