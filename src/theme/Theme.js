// src/theme/Theme.js
// Custom vibrant theme (Material You-inspired), now with light/dark support.
//
// Design note: the static `Colors`/`Typography`/etc. exports below are kept
// as-is (and equal to the DARK theme) so every existing screen/component
// that does `import { Colors } from '../theme/Theme'` keeps compiling and
// rendering exactly as before — zero risk to already-working code. New or
// migrated screens should instead call `useTheme()` (see ThemeContext.js)
// to get whichever palette (light or dark) the user has selected.
//
// The game board/dice/tokens (Board.js, Dice.js, Token.js, Scoreboard.js)
// intentionally stay on the dark palette regardless of the app theme — a
// colorful board needs its own art-directed light variant to look right,
// not just an automatic color inversion, so that's a deliberate scope cut
// for this pass rather than an oversight.

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

export const FontFamily = {
  heading: 'Baloo2_700Bold',
  headingExtraBold: 'Baloo2_800ExtraBold',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
};

const SHARED = {
  primary: '#7C5CFC',
  primaryLight: '#A78BFA',
  accent: '#FFB547',
  success: '#4ADE80',
  danger: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
  RED: '#E53E3E',
  GREEN: '#38A169',
  YELLOW: '#D69E2E',
  BLUE: '#3182CE',
};

const DARK_COLORS = {
  ...SHARED,
  mode: 'dark',
  background: '#1A1135',
  backgroundGradient: ['#2D1B4E', '#1A1135'],
  surface: '#2A1F4D',
  surfaceElevated: '#352A5C',
  textPrimary: '#F5F3FF',
  textSecondary: '#B8AEDB',
  textMuted: '#8678B5',
  board: '#FAF7FF',
  boardBorder: '#3D2F66',
  border: '#3D2F66',
};

const LIGHT_COLORS = {
  ...SHARED,
  mode: 'light',
  background: '#F5F2FF',
  backgroundGradient: ['#FFFFFF', '#ECE6FB'],
  surface: '#FFFFFF',
  surfaceElevated: '#F0EBFA',
  textPrimary: '#221A3D',
  textSecondary: '#5B5277',
  textMuted: '#8A82A3',
  board: '#FFFFFF',
  boardBorder: '#D9D0F2',
  border: '#E1DAF5',
};

function buildTypography(colors) {
  return {
    heading: {
      fontFamily: FontFamily.headingExtraBold,
      fontSize: 32,
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    subheading: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 18,
      color: colors.textSecondary,
    },
    body: {
      fontFamily: FontFamily.body,
      fontSize: 15,
      color: colors.textPrimary,
    },
    button: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 17,
      color: colors.white,
      letterSpacing: 0.3,
    },
  };
}

function buildShadow(mode) {
  // Light backgrounds need lighter, softer shadows than dark ones, or
  // cards look like they have a dirty smudge under them instead of depth.
  const opacity = mode === 'dark' ? 0.3 : 0.12;
  const buttonOpacity = mode === 'dark' ? 0.25 : 0.15;
  return {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: opacity,
      shadowRadius: 12,
      elevation: 8,
    },
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: buttonOpacity,
      shadowRadius: 6,
      elevation: 4,
    },
  };
}

/** Returns a complete theme object for the given mode ('light' | 'dark'). */
export function getTheme(mode) {
  const colors = mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
  return {
    mode: colors.mode,
    Colors: colors,
    Spacing,
    Radius,
    FontFamily,
    Typography: buildTypography(colors),
    Shadow: buildShadow(colors.mode),
  };
}

// ── Backwards-compatible static exports (= dark theme) ────────────────
// Existing screens/components that import these directly keep working
// unchanged. See file header note above.
export const Colors = DARK_COLORS;
export const Typography = buildTypography(DARK_COLORS);
export const Shadow = buildShadow('dark');

export default { Colors, Spacing, Radius, Typography, Shadow, getTheme, FontFamily };
