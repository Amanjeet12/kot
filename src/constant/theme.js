import { Platform } from 'react-native';

export const colors = {
  // Brand
  primary: '#FFD600',
  primaryDark: '#E6C000',
  primaryLight: '#FFF7CC',

  // Backgrounds
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',

  // Text
  textPrimary: '#111111',
  textSecondary: '#5F6368',
  textMuted: '#9CA3AF',
  textOnPrimary: '#111111',

  // Border
  border: '#E5E7EB',
  borderDark: '#D1D5DB',

  // Status
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#2563EB',

  // Other
  white: '#FFFFFF',
  black: '#000000',

  overlay: 'rgba(0, 0, 0, 0.5)',

  disabled: '#E5E7EB',
  disabledText: '#9CA3AF',
};

export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
  }),

  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
  }),

  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif',
  }),
};

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  heading: 32,
  hero: 42,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 20,
  md: 24,
  lg: 28,
  xl: 32,
  heading: 40,
};

export const spacing = {
  none: 0,

  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 60,
};

export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  card: 20,
  round: 999,
};

export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    android: {
      elevation: 2,
    },
  }),

  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 5,
      },
    },

    android: {
      elevation: 4,
    },
  }),
};

export const theme = {
  colors,
  fontFamily,
  typography: {
    fontSize,
    fontWeight,
    lineHeight,
  },
  spacing,
  radius,
  shadows,
};
