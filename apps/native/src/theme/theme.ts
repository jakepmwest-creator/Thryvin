// Mock React Native Paper theme for development
const MD3LightTheme = {
  colors: {
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FFFBFE',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
  },
};

const configureFonts = (config: any) => config;

const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  // Add more font configurations as needed
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7A3CF3',
    primaryContainer: '#EFEAFF',
    secondary: '#FF4FD8',
    secondaryContainer: '#FFE8F7',
    tertiary: '#00D4AA',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    background: '#FAFBFC',
    error: '#EF4444',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1F2937',
    onBackground: '#1F2937',
    outline: '#E5E7EB',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 16,
};

export const gradients = {
  primary: ['#7A3CF3', '#FF4FD8'],
  secondary: ['#FF4FD8', '#7A3CF3'],
  tertiary: ['#00D4AA', '#7A3CF3'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};