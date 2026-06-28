// src/theme/Theme.js
// Custom vibrant theme (Material You-inspired) used across the app.

export const Colors = {
  background: '#1A1135',
  backgroundGradient: ['#2D1B4E', '#1A1135'],
  surface: '#2A1F4D',
  surfaceElevated: '#352A5C',
  primary: '#7C5CFC',
  primaryLight: '#A78BFA',
  accent: '#FFB547',
  success: '#4ADE80',
  danger: '#F87171',

  textPrimary: '#F5F3FF',
  textSecondary: '#B8AEDB',
  textMuted: '#8678B5',

  board: '#FAF7FF',
  boardBorder: '#3D2F66',

  white: '#FFFFFF',
  black: '#000000',

  RED: '#E53E3E',
  GREEN: '#38A169',
  YELLOW: '#D69E2E',
  BLUE: '#3182CE',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

export const Typography = {
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  button: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
};

export default { Colors, Spacing, Radius, Typography, Shadow };
