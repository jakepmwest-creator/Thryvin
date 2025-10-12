// Real React Native components with identical styling to match MockComponents
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Real imports that will work when packages are installed
export { SafeAreaView } from 'react-native-safe-area-context';
export { Ionicons } from '@expo/vector-icons';
export { LinearGradient } from 'expo-linear-gradient';

// Import real Paper components
import { 
  Card as PaperCard,
  Button as PaperButton,
  ProgressBar as PaperProgressBar,
  Chip as PaperChip,
  Switch as PaperSwitch,
  Avatar as PaperAvatar,
  Divider as PaperDivider
} from 'react-native-paper';

// Card wrapper to maintain exact same styling
interface CardComponent extends React.FC<{ children: React.ReactNode; style?: any }> {
  Content: React.FC<{ children: React.ReactNode; style?: any }>;
}

export const Card: CardComponent = ({ children, style }) => (
  <PaperCard style={[styles.card, style]}>
    {children}
  </PaperCard>
) as CardComponent;

Card.Content = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <PaperCard.Content style={[{ padding: 16 }, style]}>
    {children}
  </PaperCard.Content>
);

// Button wrapper to maintain exact same styling
export const Button: React.FC<{
  children: React.ReactNode;
  mode?: 'contained' | 'outlined' | 'text';
  style?: any;
  contentStyle?: any;
  onPress: () => void;
}> = ({ children, mode = 'contained', style, onPress, contentStyle }) => (
  <PaperButton
    mode={mode}
    onPress={onPress}
    style={[
      styles.button,
      mode === 'contained' && styles.containedButton,
      mode === 'outlined' && styles.outlinedButton,
      style
    ]}
    contentStyle={[styles.buttonContent, contentStyle]}
    labelStyle={[
      styles.buttonText,
      mode === 'contained' && styles.containedButtonText,
      mode === 'outlined' && styles.outlinedButtonText
    ]}
  >
    {children}
  </PaperButton>
);

// ProgressBar wrapper to maintain exact same styling
export const ProgressBar: React.FC<{ progress: number; color: string; style?: any }> = ({ progress, color, style }) => (
  <PaperProgressBar
    progress={progress}
    color={color}
    style={[styles.progressBar, style]}
  />
);

// Chip wrapper to maintain exact same styling
export const Chip: React.FC<{
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
  icon?: () => React.ReactNode;
  onPress: () => void;
}> = ({ children, style, onPress, icon, textStyle }) => (
  <PaperChip
    onPress={onPress}
    style={[styles.chip, style]}
    textStyle={[styles.chipText, textStyle]}
    icon={icon}
  >
    {children}
  </PaperChip>
);

// Switch wrapper to maintain exact same styling
export const Switch: React.FC<{ 
  value: boolean; 
  onValueChange: () => void; 
  color?: string;
}> = ({ value, onValueChange, color = '#7A3CF3' }) => (
  <PaperSwitch
    value={value}
    onValueChange={onValueChange}
    color={color}
  />
);

// Avatar wrapper to maintain exact same styling
export const Avatar = {
  Text: ({ size, label, style, labelStyle }: { 
    size: number; 
    label: string; 
    style?: any; 
    labelStyle?: any;
  }) => (
    <PaperAvatar.Text
      size={size}
      label={label}
      style={[
        {
          backgroundColor: '#7A3CF3',
        },
        style
      ]}
      labelStyle={[
        {
          color: 'white',
          fontSize: size / 3,
          fontWeight: 'bold',
        },
        labelStyle
      ]}
    />
  )
};

// Divider wrapper to maintain exact same styling
export const Divider: React.FC<{ style?: any }> = ({ style }) => (
  <PaperDivider style={[{ marginVertical: 8 }, style]} />
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
    borderRadius: 8,
  },
  containedButton: {
    backgroundColor: '#7A3CF3',
  },
  outlinedButton: {
    borderColor: '#7A3CF3',
  },
  buttonContent: {
    paddingVertical: 4,
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
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  chip: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    margin: 4,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
});