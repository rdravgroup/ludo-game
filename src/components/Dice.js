// src/components/Dice.js
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/Theme';

const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

const GRADIENT_ID = 'diceFaceGrad';

/**
 * Dice with simulated "tumble" physics: during a roll it cycles through
 * randomized faces (like a real die tumbling showing different sides),
 * spins with decelerating rotation, and settles with a small bounce
 * overshoot rather than stopping dead — this reads as physical weight
 * rather than a flat UI spin.
 */
export default function Dice({ value, isRolling, disabled, onPress, color = Colors.accent, size = 72 }) {
  const rotation = useSharedValue(0);
  const scaleY = useSharedValue(1);
  const translateY = useSharedValue(0);
  const [scrambleFace, setScrambleFace] = useState(null);
  const scrambleTimer = useRef(null);

  useEffect(() => {
    if (isRolling) {
      // Rapid face scrambling to simulate tumbling, slowing down near the end.
      let elapsed = 0;
      const totalDuration = 650;
      const tick = () => {
        setScrambleFace(1 + Math.floor(Math.random() * 6));
        elapsed += 70;
        if (elapsed < totalDuration) {
          // Slow down the scramble rate as we approach settle, like a real die.
          const nextDelay = 70 + (elapsed / totalDuration) * 90;
          scrambleTimer.current = setTimeout(tick, nextDelay);
        } else {
          setScrambleFace(null);
        }
      };
      tick();

      // Spin: fast multi-rotation that decelerates into the final orientation.
      rotation.value = 0;
      rotation.value = withTiming(360 * (2 + Math.random()), {
        duration: 650,
        easing: Easing.out(Easing.cubic),
      });

      // Vertical "weight": die lifts slightly then drops and overshoots on
      // landing, settling with a couple of decreasing bounces.
      translateY.value = withSequence(
        withTiming(-size * 0.22, { duration: 160, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
        withTiming(-size * 0.06, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 110, easing: Easing.inOut(Easing.quad) })
      );

      // Squash on impact for a touch of cartoon weight.
      scaleY.value = withSequence(
        withTiming(1, { duration: 380 }),
        withTiming(0.82, { duration: 60 }),
        withTiming(1.08, { duration: 90 }),
        withTiming(1, { duration: 120 })
      );
    }
    return () => {
      if (scrambleTimer.current) clearTimeout(scrambleTimer.current);
    };
  }, [isRolling]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scaleY: scaleY.value },
    ],
  }));

  const displayValue = scrambleFace || (value && value >= 1 && value <= 6 ? value : 1);
  const pips = PIP_LAYOUTS[displayValue];

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.touchable}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={disabled ? '#6B6480' : '#FFFFFF'} />
              <Stop offset="100%" stopColor={disabled ? '#564F6E' : '#ECE9FA'} />
            </LinearGradient>
          </Defs>
          {/* drop shadow */}
          <Rect x={8} y={10} width={88} height={88} rx={20} fill="rgba(0,0,0,0.25)" />
          <Rect
            x={4}
            y={4}
            width={92}
            height={92}
            rx={18}
            fill={`url(#${GRADIENT_ID})`}
            stroke={color}
            strokeWidth={5}
          />
          {pips.map(([cx, cy], i) => (
            <React.Fragment key={i}>
              <Circle cx={cx + 1.5} cy={cy + 2} r={8} fill="rgba(0,0,0,0.18)" />
              <Circle cx={cx} cy={cy} r={8} fill={disabled ? '#8B85A0' : '#2D1B4E'} />
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
