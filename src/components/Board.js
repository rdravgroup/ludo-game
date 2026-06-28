// src/components/Board.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Polygon, Circle, G, Line, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import {
  GRID_SIZE,
  MAIN_PATH,
  HOME_STRETCH,
  YARD_POSITIONS,
  SAFE_INDICES,
  PLAYER_THEME,
  HOME_CENTER,
} from '../utils/BoardConfig';
import { Colors } from '../theme/Theme';

// cellSize is computed by parent based on available width; we render in a
// 0..GRID_SIZE viewBox so it scales perfectly to any container size.
const VB = GRID_SIZE;

export default function Board({ size }) {
  return (
    <View style={[styles.shadowWrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          {['RED', 'GREEN', 'YELLOW', 'BLUE'].map((color) => (
            <LinearGradient key={color} id={`yardGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={PLAYER_THEME[color].primary} />
              <Stop offset="100%" stopColor={PLAYER_THEME[color].dark} />
            </LinearGradient>
          ))}
          <RadialGradient id="boardGlow" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor={Colors.board} />
          </RadialGradient>
        </Defs>

        {/* Board background */}
        <Rect x={0} y={0} width={VB} height={VB} fill="url(#boardGlow)" rx={0.3} />

        {/* Yards (4 colored corner squares) */}
        <YardQuadrant color="RED" x={0} y={0} />
        <YardQuadrant color="GREEN" x={9} y={0} />
        <YardQuadrant color="YELLOW" x={9} y={9} />
        <YardQuadrant color="BLUE" x={0} y={9} />

        {/* Center home triangle pinwheel */}
        <CenterHome />

        {/* Main path cells (52) */}
        {MAIN_PATH.map(([col, row], i) => (
          <PathCell key={`path-${i}`} col={col} row={row} isSafe={SAFE_INDICES.includes(i)} />
        ))}

        {/* Colored start cells get a tinted overlay matching their color */}
        <StartTint color="RED" col={1} row={6} />
        <StartTint color="GREEN" col={8} row={1} />
        <StartTint color="YELLOW" col={13} row={8} />
        <StartTint color="BLUE" col={6} row={13} />

        {/* Home stretches (colored lanes leading to center) */}
        {Object.entries(HOME_STRETCH).map(([color, cells]) =>
          cells.map(([col, row], i) => (
            <Rect
              key={`${color}-stretch-${i}`}
              x={col}
              y={row}
              width={1}
              height={1}
              fill={PLAYER_THEME[color].light}
              stroke={Colors.boardBorder}
              strokeWidth={0.02}
            />
          ))
        )}

        {/* Grid outline for the cross-shaped play area */}
        <CrossOutline />

        {/* Outer board border for a finished, framed look */}
        <Rect x={0.06} y={0.06} width={VB - 0.12} height={VB - 0.12} fill="none" stroke={Colors.boardBorder} strokeWidth={0.12} rx={0.3} />

        {/* Yard token slot dots (visual only, tokens render on top via Token.js) */}
        {Object.entries(YARD_POSITIONS).map(([color, slots]) =>
          slots.map(([cx, cy], i) => (
            <Circle
              key={`${color}-slot-${i}`}
              cx={cx}
              cy={cy}
              r={0.45}
              fill="rgba(255,255,255,0.35)"
              stroke={PLAYER_THEME[color].dark}
              strokeWidth={0.04}
            />
          ))
        )}
      </Svg>
    </View>
  );
}

function YardQuadrant({ color, x, y }) {
  return (
    <G>
      <Rect x={x} y={y} width={6} height={6} fill={`url(#yardGrad-${color})`} />
      <Rect
        x={x + 0.6}
        y={y + 0.6}
        width={4.8}
        height={4.8}
        fill={Colors.board}
        rx={0.5}
      />
    </G>
  );
}

function PathCell({ col, row, isSafe }) {
  return (
    <G>
      <Rect
        x={col}
        y={row}
        width={1}
        height={1}
        fill={isSafe ? '#FFF4D6' : Colors.board}
        stroke={Colors.boardBorder}
        strokeWidth={0.02}
      />
      {isSafe && (
        <Polygon
          points={star(col + 0.5, row + 0.5, 0.32, 0.14, 5)}
          fill="#E2C76B"
        />
      )}
    </G>
  );
}

function StartTint({ color, col, row }) {
  const theme = PLAYER_THEME[color];
  return (
    <G>
      <Rect x={col} y={row} width={1} height={1} fill={theme.light} opacity={0.85} />
      <Polygon points={arrow(col, row, color)} fill={theme.primary} />
    </G>
  );
}

function arrow(col, row, color) {
  // small directional arrow inside the start cell, rotated per entry direction
  const cx = col + 0.5;
  const cy = row + 0.5;
  const dirs = {
    RED: [[cx - 0.25, cy - 0.25], [cx + 0.25, cy], [cx - 0.25, cy + 0.25]],
    GREEN: [[cx - 0.25, cy - 0.25], [cx, cy + 0.25], [cx + 0.25, cy - 0.25]],
    YELLOW: [[cx + 0.25, cy - 0.25], [cx - 0.25, cy], [cx + 0.25, cy + 0.25]],
    BLUE: [[cx + 0.25, cy + 0.25], [cx, cy - 0.25], [cx - 0.25, cy + 0.25]],
  };
  return dirs[color].map((p) => p.join(',')).join(' ');
}

function CenterHome() {
  const cx = HOME_CENTER[0];
  const cy = HOME_CENTER[1];
  return (
    <G>
      <Polygon
        points={`${cx - 1},${cy - 1} ${cx},${cy} ${cx - 1},${cy + 1}`}
        fill={PLAYER_THEME.RED.primary}
      />
      <Polygon
        points={`${cx - 1},${cy - 1} ${cx},${cy} ${cx + 1},${cy - 1}`}
        fill={PLAYER_THEME.GREEN.primary}
      />
      <Polygon
        points={`${cx + 1},${cy - 1} ${cx},${cy} ${cx + 1},${cy + 1}`}
        fill={PLAYER_THEME.YELLOW.primary}
      />
      <Polygon
        points={`${cx - 1},${cy + 1} ${cx},${cy} ${cx + 1},${cy + 1}`}
        fill={PLAYER_THEME.BLUE.primary}
      />
    </G>
  );
}

function CrossOutline() {
  return (
    <G stroke={Colors.boardBorder} strokeWidth={0.04} fill="none">
      <Line x1={6} y1={0} x2={6} y2={6} />
      <Line x1={9} y1={0} x2={9} y2={6} />
      <Line x1={6} y1={9} x2={6} y2={15} />
      <Line x1={9} y1={9} x2={9} y2={15} />
      <Line x1={0} y1={6} x2={6} y2={6} />
      <Line x1={0} y1={9} x2={6} y2={9} />
      <Line x1={9} y1={6} x2={15} y2={6} />
      <Line x1={9} y1={9} x2={15} y2={9} />
      <Rect x={6} y={6} width={3} height={3} fill="none" />
    </G>
  );
}

function star(cx, cy, outerR, innerR, points) {
  const step = Math.PI / points;
  let coords = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    coords.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return coords.join(' ');
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 8,
  },
});
