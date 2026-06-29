// src/components/Token.js
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  GRID_SIZE,
  YARD_POSITIONS,
  HOME_STRETCH,
  HOME_CENTER,
  PLAYER_THEME,
} from '../utils/BoardConfig';
import { getAbsolutePathIndex, MAIN_PATH } from '../utils/GameLogic';
import { MAIN_PATH as PATH_CELLS } from '../utils/BoardConfig';

/**
 * Resolve a token's current grid (col,row) center coordinate from its
 * logical state. This is the bridge between GameLogic's abstract
 * relativeStep model and actual pixel/grid placement.
 */
export function resolveTokenGridPosition(token) {
  const { color, tokenIndex, state, relativeStep } = token;

  if (state === 'YARD') {
    const [x, y] = YARD_POSITIONS[color][tokenIndex];
    return { x, y };
  }

  if (relativeStep <= 50) {
    const absIndex = getAbsolutePathIndex(color, relativeStep);
    const [col, row] = PATH_CELLS[absIndex];
    return { x: col + 0.5, y: row + 0.5 };
  }

  if (relativeStep <= 55) {
    const stretchIdx = relativeStep - 51;
    const [col, row] = HOME_STRETCH[color][stretchIdx];
    return { x: col + 0.5, y: row + 0.5 };
  }

  // relativeStep === 56 -> finished, sits near center, offset slightly
  // per tokenIndex so 4 finished tokens don't fully overlap.
  const angle = (tokenIndex / 4) * Math.PI * 2;
  return {
    x: HOME_CENTER[0] + 0.28 * Math.cos(angle),
    y: HOME_CENTER[1] + 0.28 * Math.sin(angle),
  };
}

function TokenBase({ token, cellSizePx, isMovable, onPress, highlight }) {
  const { x, y } = resolveTokenGridPosition(token);
  const theme = PLAYER_THEME[token.color];

  const translateX = useSharedValue(x * cellSizePx);
  const translateY = useSharedValue(y * cellSizePx);
  const hopOffset = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(x * cellSizePx, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(y * cellSizePx, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    // A small upward hop mid-move gives the token physical weight rather
    // than gliding flat across the board, like a piece being picked up
    // and set back down.
    hopOffset.value = withSequence(
      withTiming(-cellSizePx * 0.35, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) })
    );
  }, [x, y, cellSizePx]);

  useEffect(() => {
    if (highlight) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 260 }),
        withTiming(1, { duration: 260 })
      );
    }
  }, [highlight]);

  useEffect(() => {
    if (isMovable) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 480, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 480, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [isMovable]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - cellSizePx * 0.32 },
      { translateY: translateY.value + hopOffset.value - cellSizePx * 0.32 },
      { scale: scale.value * (isMovable ? pulse.value : 1) },
    ],
  }));

  const radius = cellSizePx * 0.32;
  const gradId = `tokenGrad-${token.id}`;

  return (
    <Animated.View
      style={[
        styles.tokenContainer,
        { width: radius * 2, height: radius * 2 },
        animatedStyle,
      ]}
      onTouchEnd={isMovable ? () => onPress(token.id) : undefined}
    >
      <Svg width={radius * 2} height={radius * 2} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={gradId} cx="38%" cy="30%" r="75%">
            <Stop offset="0%" stopColor={lighten(theme.primary)} />
            <Stop offset="65%" stopColor={theme.primary} />
            <Stop offset="100%" stopColor={theme.dark} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={50} cy={70} rx={28} ry={9} fill="rgba(0,0,0,0.3)" />
        <Circle cx={50} cy={42} r={34} fill={`url(#${gradId})`} stroke="#fff" strokeWidth={4} />
        <Circle cx={50} cy={42} r={15} fill={theme.dark} opacity={0.55} />
        {/* glossy highlight */}
        <Ellipse cx={40} cy={30} rx={11} ry={7} fill="rgba(255,255,255,0.55)" />
        {isMovable && (
          <Circle
            cx={50}
            cy={42}
            r={40}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeDasharray="6,6"
            opacity={0.9}
          />
        )}
      </Svg>
    </Animated.View>
  );
}

function lighten(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 70);
  const g = Math.min(255, ((num >> 8) & 0xff) + 70);
  const b = Math.min(255, (num & 0xff) + 70);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  tokenContainer: {
    position: 'absolute',
  },
});

/**
 * GameLogic.applyMove clones EVERY token into a new object on every move
 * (see cloneTokens in GameLogic.js), not just the one that actually
 * changed — so a plain `React.memo(Token)` with default shallow-prop
 * comparison would see a new `token` object reference each time and
 * re-render anyway, providing no real benefit. This comparator instead
 * checks the fields that actually affect what gets rendered, so tokens
 * that didn't logically change skip re-rendering even though their
 * object reference did.
 */
function areTokenPropsEqual(prevProps, nextProps) {
  return (
    prevProps.token.state === nextProps.token.state &&
    prevProps.token.relativeStep === nextProps.token.relativeStep &&
    prevProps.cellSizePx === nextProps.cellSizePx &&
    prevProps.isMovable === nextProps.isMovable &&
    prevProps.highlight === nextProps.highlight &&
    prevProps.onPress === nextProps.onPress
  );
}

export default React.memo(TokenBase, areTokenPropsEqual);
