import React from 'react';
import { View, StyleSheet } from 'react-native';
// Mock React Native Paper and LinearGradient for development
const Text = ({ children, style, variant, ...props }: any) => (
  <View style={[{ padding: 4 }, style]} {...props}>
    {typeof children === 'string' ? children : 'Text'}
  </View>
);

const LinearGradient = ({ children, style, colors, ...props }: any) => (
  <View style={[{ backgroundColor: colors?.[0] || '#7A3CF3' }, style]} {...props}>
    {children}
  </View>
);

const gradients = {
  primary: ['#7A3CF3', '#FF4FD8'],
};

const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const ThryvinLogo = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.logoBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.logoText}>T</Text>
      </LinearGradient>
      <Text style={styles.brandText}>Thryvin'</Text>
      <Text style={styles.tagline}>AI-Powered Fitness Coaching</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#7A3CF3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7A3CF3',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});