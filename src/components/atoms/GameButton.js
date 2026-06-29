// src/components/atoms/GameButton.js
//
// Atomic button used everywhere instead of one-off Pressable + StyleSheet
// blocks repeated per screen. Theme-aware (reads colors/fonts from
// useTheme()), gives a small scale-down press animation via Reanimated,
// and fires a light haptic tap automatically — callers don't need to
// remember to add haptics themselves.

import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

const VARIANT_COLOR_KEY = {
  primary: 'primary',
  accent: 'accent',
  success: 'success',
  danger: 'danger',
};

function GameButtonBase({
  label,
  onPress,
  variant = 'primary',
  outline = false,
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 80 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (hapticStyle) Haptics.impactAsync(hapticStyle).catch(() => {});
    onPress?.();
  }, [disabled, loading, onPress, hapticStyle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseColor = theme.Colors[VARIANT_COLOR_KEY[variant]] || theme.Colors.primary;
  const backgroundColor = outline ? 'transparent' : baseColor;
  const borderColor = baseColor;
  const textColor = outline ? baseColor : theme.Colors.white;

  return (
    <Animated.View style={[animatedStyle, disabled && styles.disabledWrap]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          theme.Shadow.button,
          {
            backgroundColor,
            borderColor,
            borderWidth: outline ? 2 : 0,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                { color: textColor, fontFamily: theme.FontFamily.bodyBold },
                textStyle,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  text: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  disabledWrap: {
    opacity: 0.5,
  },
});

export default React.memo(GameButtonBase);
