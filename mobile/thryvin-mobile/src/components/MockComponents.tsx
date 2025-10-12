// Simplified mock components to avoid missing dependencies during development
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Mock SafeAreaView
export const SafeAreaView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[{ flex: 1, paddingTop: 40 }, style]}>{children}</View>
);

// Mock Card
export const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

Card.Content = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[{ padding: 16 }, style]}>{children}</View>
);

// Mock Button
export const Button: React.FC<{
  children: React.ReactNode;
  mode?: string;
  style?: any;
  contentStyle?: any;
  onPress: () => void;
}> = ({ children, mode, style, onPress }) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.containedButton,
      mode === 'outlined' && styles.outlinedButton,
      style
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.containedButtonText,
      mode === 'outlined' && styles.outlinedButtonText
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

// Mock ProgressBar
export const ProgressBar: React.FC<{ progress: number; color: string; style?: any }> = ({ progress, color, style }) => (
  <View style={[styles.progressBarContainer, style]}>
    <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

// Mock Chip
export const Chip: React.FC<{
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
  icon?: () => React.ReactNode;
  onPress: () => void;
}> = ({ children, style, onPress, icon }) => (
  <TouchableOpacity style={[styles.chip, style]} onPress={onPress}>
    {icon && icon()}
    <Text style={styles.chipText}>{children}</Text>
  </TouchableOpacity>
);

// Mock Switch
export const Switch: React.FC<{ value: boolean; onValueChange: () => void; color?: string }> = ({ value, onValueChange, color }) => (
  <TouchableOpacity
    style={[styles.switch, { backgroundColor: value ? (color || '#7A3CF3') : '#E5E5E5' }]}
    onPress={onValueChange}
  >
    <View style={[styles.switchThumb, { marginLeft: value ? 20 : 2 }]} />
  </TouchableOpacity>
);

// Mock LinearGradient
export const LinearGradient: React.FC<{
  colors: string[];
  children: React.ReactNode;
  style?: any;
}> = ({ colors, children, style }) => (
  <View style={[{ backgroundColor: colors[0] }, style]}>
    {children}
  </View>
);

// Mock Avatar
export const Avatar = {
  Text: ({ size, label, style, labelStyle }: { size: number; label: string; style?: any; labelStyle?: any }) => (
    <View style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#7A3CF3',
        justifyContent: 'center',
        alignItems: 'center',
      },
      style
    ]}>
      <Text style={[{ color: 'white', fontSize: size / 3, fontWeight: 'bold' }, labelStyle]}>
        {label}
      </Text>
    </View>
  )
};

// Mock Divider
export const Divider: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: '#E5E5E5', marginVertical: 8 }, style]} />
);

// Mock Ionicons
export const Ionicons: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => (
  <View style={{
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: size / 4,
    opacity: 0.8,
  }} />
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  containedButton: {
    backgroundColor: '#7A3CF3',
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: '#7A3CF3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  containedButtonText: {
    color: 'white',
  },
  outlinedButtonText: {
    color: '#7A3CF3',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    margin: 4,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
});