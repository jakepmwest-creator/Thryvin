import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7A3CF3',
    secondary: '#FF4FD8',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    onSurface: '#1F2937',
    onBackground: '#374151',
  },
};

export const brandColors = {
  primary: '#7A3CF3',
  secondary: '#FF4FD8',
  gradient: ['#7A3CF3', '#FF4FD8'],
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray600: '#475569',
  gray900: '#0F172A',
};