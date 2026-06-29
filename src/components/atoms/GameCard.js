// src/components/atoms/GameCard.js
//
// Atomic elevated surface container — replaces the repeated
// "View with surface background + radius + shadow" pattern duplicated
// across HomeScreen/ProfileScreen/LeaderboardScreen/etc.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

function GameCardBase({ children, style, elevated = true, padded = true }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.Colors.surface,
          borderRadius: theme.Radius.md,
          borderColor: theme.Colors.border,
        },
        elevated && theme.Shadow.card,
        padded && { padding: theme.Spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});

export default React.memo(GameCardBase);
