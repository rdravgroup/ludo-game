// src/components/Scoreboard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../theme/Theme';
import { PLAYER_THEME } from '../utils/BoardConfig';

export default function Scoreboard({ activeColors, tokens, currentColor, playerNames = {} }) {
  return (
    <View style={styles.row}>
      {activeColors.map((color) => {
        const homeCount = tokens[color].filter((t) => t.state === 'HOME').length;
        const isTurn = color === currentColor;
        const theme = PLAYER_THEME[color];
        return (
          <View
            key={color}
            style={[
              styles.chip,
              { borderColor: theme.primary },
              isTurn && { backgroundColor: theme.primary },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.name, isTurn && styles.nameActive]} numberOfLines={1}>
              {playerNames[color] || color}
            </Text>
            <Text style={[styles.score, isTurn && styles.nameActive]}>{homeCount}/4</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    borderWidth: 2,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
    maxWidth: 70,
  },
  nameActive: {
    color: Colors.white,
  },
  score: {
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
});
