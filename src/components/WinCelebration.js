// src/components/WinCelebration.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, Typography } from '../theme/Theme';
import { PLAYER_THEME } from '../utils/BoardConfig';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COLORS = ['#7C5CFC', '#FFB547', '#4ADE80', '#F87171', '#3182CE', '#D69E2E'];

function ConfettiPiece({ index }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(Math.random() * SCREEN_W);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const delay = Math.random() * 600;
    const duration = 2200 + Math.random() * 1400;
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_H + 40, { duration, easing: Easing.in(Easing.quad) })
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1)
    );
    opacity.value = withDelay(delay + duration - 400, withTiming(0, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isCircle = index % 2 === 0;

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          borderRadius: isCircle ? 6 : 2,
          width: isCircle ? 10 : 8,
          height: isCircle ? 10 : 14,
        },
        style,
      ]}
    />
  );
}

export default function WinCelebration({ visible, winnerColor, winnerName, onPlayAgain, onExit }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.back(1.5)) });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const theme = PLAYER_THEME[winnerColor] || PLAYER_THEME.RED;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      {Array.from({ length: 40 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      <Animated.View style={[styles.card, { borderColor: theme.primary }, cardStyle]}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={[styles.winnerText, { color: theme.primary }]}>
          {winnerName} Wins!
        </Text>
        <Text style={styles.subtext}>All tokens reached home safely</Text>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onPlayAgain}>
            <Text style={Typography.button}>Play Again</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onExit}>
            <Text style={[Typography.button, { color: Colors.textPrimary }]}>Exit</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: 'rgba(10,5,25,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  card: {
    width: SCREEN_W * 0.8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  trophy: { fontSize: 64, marginBottom: Spacing.sm },
  winnerText: { fontSize: 26, fontWeight: '800', marginBottom: Spacing.xs },
  subtext: { color: Colors.textSecondary, marginBottom: Spacing.lg },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  buttonPrimary: { backgroundColor: Colors.primary },
  buttonSecondary: { backgroundColor: Colors.surfaceElevated },
});
