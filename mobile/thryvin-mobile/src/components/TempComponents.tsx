// Temporary components that work without external dependencies for now
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

// Temporary SafeAreaView
export { SafeAreaView } from 'react-native';

// Temporary Ionicons replacement
export const Ionicons: React.FC<{ name: string; size: number; color: string }> = ({ name, color }) => (
  <Text style={{ color, fontSize: 20 }}>●</Text>
);

// Temporary LinearGradient
export const LinearGradient: React.FC<{ 
  colors: string[]; 
  style?: any; 
  children: React.ReactNode;
}> = ({ colors, style, children }) => (
  <View style={[{ backgroundColor: colors[0] }, style]}>
    {children}
  </View>
);

// Card with proper TypeScript interface
interface CardComponent extends React.FC<{ children: React.ReactNode; style?: any }> {
  Content: React.FC<{ children: React.ReactNode; style?: any }>;
}

export const Card: CardComponent = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
) as CardComponent;

Card.Content = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[{ padding: 16 }, style]}>
    {children}
  </View>
);

// Button
export const Button: React.FC<{
  children: React.ReactNode;
  mode?: 'contained' | 'outlined' | 'text';
  style?: any;
  contentStyle?: any;
  onPress: () => void;
}> = ({ children, mode = 'contained', style, onPress }) => (
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

// ProgressBar
export const ProgressBar: React.FC<{ progress: number; color: string; style?: any }> = ({ progress, color, style }) => (
  <View style={[styles.progressBarContainer, style]}>
    <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }]} />
  </View>
);

// Chip
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

// Switch
export const Switch: React.FC<{ 
  value: boolean; 
  onValueChange: () => void; 
  color?: string;
}> = ({ value, onValueChange, color = '#7A3CF3' }) => (
  <TouchableOpacity
    style={[styles.switch, { backgroundColor: value ? color : '#E5E5E5' }]}
    onPress={onValueChange}
  >
    <View style={[styles.switchThumb, { marginLeft: value ? 20 : 2 }]} />
  </TouchableOpacity>
);

// Avatar
export const Avatar = {
  Text: ({ size, label, style }: { 
    size: number; 
    label: string; 
    style?: any;
  }) => (
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
      <Text style={{
        color: 'white',
        fontSize: size / 3,
        fontWeight: 'bold',
      }}>
        {label}
      </Text>
    </View>
  )
};

// Divider
export const Divider: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: '#E5E5E5', marginVertical: 8 }, style]} />
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
    margin: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containedButton: {
    backgroundColor: '#7A3CF3',
  },
  outlinedButton: {
    borderColor: '#7A3CF3',
    borderWidth: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
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