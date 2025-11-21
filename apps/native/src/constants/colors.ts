// Thryvin Color Palette - Purple to Pink Gradient Theme
export const COLORS = {
  // Primary gradients - THE CORRECT GRADIENT
  primary: '#A22BF6', // Purple
  primaryLight: '#C84BF8',
  accent: '#A22BF6', // Purple
  accentSecondary: '#FF4EC7', // Hot Pink
  
  // Gradient stops for purple-to-pink
  gradientStart: '#A22BF6', // Purple
  gradientEnd: '#FF4EC7', // Hot Pink
  
  // UI colors
  white: '#ffffff',
  text: '#222222',
  textSecondary: '#666666',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  darkGray: '#2C2C2E',
  background: '#FAFAFA',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5B8DEF',
  
  // Card effects
  cardShadow: 'rgba(255, 59, 142, 0.15)',
  cardBorder: 'rgba(255, 255, 255, 0.8)',
  
  // Explore category gradients - VIBRANT DIFFERENT COLORS
  strength: ['#5B8DEF', '#34C4E5'], // Blue to cyan
  cardio: ['#FF6B35', '#FFD60A'], // Orange to yellow
  flexibility: ['#A22BF6', '#FF4EC7'], // Purple to pink
  hiit: ['#FF3B30', '#FF9500'], // Red to orange
  mobility: ['#34C759', '#00C7BE'], // Green to teal
  conditioning: ['#FFD60A', '#FFED4E'], // Yellow to light yellow
};

// 3D Card Shadow preset - Purple shadow
export const CARD_SHADOW = {
  shadowColor: '#A22BF6',
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 8,
};

// Subtle card shadow
export const CARD_SHADOW_SUBTLE = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};
