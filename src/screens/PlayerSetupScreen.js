// src/screens/PlayerSetupScreen.js
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../theme/Theme';
import { PLAYER_THEME, PLAYER_ORDER } from '../utils/BoardConfig';
import { AIDifficulty } from '../utils/AI';
import { useGameStore } from '../store/useGameStore';

const DIFFICULTY_LABELS = {
  [AIDifficulty.EASY]: { label: 'Easy', sub: 'Relaxed, mostly random' },
  [AIDifficulty.MEDIUM]: { label: 'Medium', sub: 'Plays smart, no lookahead' },
  [AIDifficulty.HARD]: { label: 'Hard', sub: 'Plans ahead, avoids traps' },
};

export default function PlayerSetupScreen({ navigation, route }) {
  const { mode } = route.params; // 'local' | 'ai'
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedColors, setSelectedColors] = useState(['RED', 'GREEN', 'YELLOW', 'BLUE']);
  const [difficulty, setDifficulty] = useState(AIDifficulty.MEDIUM);
  const startGame = useGameStore((s) => s.startGame);

  const togglePlayerCount = (count) => {
    setPlayerCount(count);
    setSelectedColors(PLAYER_ORDER.slice(0, count));
  };

  const handleStart = () => {
    const activeColors = selectedColors.slice(0, playerCount);
    let aiColors = [];
    if (mode === 'ai') {
      // First color is the human; rest are AI.
      aiColors = activeColors.slice(1);
    }
    startGame(activeColors, mode, aiColors, mode === 'ai' ? difficulty : null);
    navigation.replace('Game');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={Typography.subheading}>Number of Players</Text>
      <View style={styles.countRow}>
        {[2, 3, 4].map((count) => (
          <Pressable
            key={count}
            style={[styles.countBtn, playerCount === count && styles.countBtnActive]}
            onPress={() => togglePlayerCount(count)}
          >
            <Text
              style={[
                styles.countText,
                playerCount === count && styles.countTextActive,
              ]}
            >
              {count}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'ai' && (
        <>
          <Text style={[Typography.subheading, { marginTop: Spacing.lg }]}>AI Difficulty</Text>
          <View style={styles.difficultyRow}>
            {Object.values(AIDifficulty).map((level) => (
              <Pressable
                key={level}
                style={[styles.difficultyBtn, difficulty === level && styles.difficultyBtnActive]}
                onPress={() => setDifficulty(level)}
              >
                <Text style={[styles.difficultyLabel, difficulty === level && styles.difficultyLabelActive]}>
                  {DIFFICULTY_LABELS[level].label}
                </Text>
                <Text style={styles.difficultySub}>{DIFFICULTY_LABELS[level].sub}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={[Typography.subheading, { marginTop: Spacing.lg }]}>
        {mode === 'ai' ? 'You play as:' : 'Active Colors'}
      </Text>
      <View style={styles.colorGrid}>
        {PLAYER_ORDER.slice(0, 4).map((color, i) => {
          const isActive = selectedColors.slice(0, playerCount).includes(color);
          const isHumanSeat = mode === 'ai' && i === 0;
          return (
            <View
              key={color}
              style={[
                styles.colorCard,
                { borderColor: PLAYER_THEME[color].primary },
                !isActive && styles.colorCardDim,
              ]}
            >
              <View style={[styles.colorSwatch, { backgroundColor: PLAYER_THEME[color].primary }]} />
              <Text style={styles.colorLabel}>{color}</Text>
              <Text style={styles.colorRole}>
                {!isActive ? 'Inactive' : mode === 'ai' ? (isHumanSeat ? 'You' : 'AI') : 'Human'}
              </Text>
            </View>
          );
        })}
      </View>

      <Pressable style={styles.startBtn} onPress={handleStart}>
        <Text style={Typography.button}>Start Game</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  countRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  countBtn: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  countBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  countText: { color: Colors.textSecondary, fontSize: 20, fontWeight: '700' },
  countTextActive: { color: Colors.white },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  colorCard: {
    width: '46%',
    borderWidth: 2,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  colorCardDim: { opacity: 0.35 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, marginBottom: 6 },
  colorLabel: { color: Colors.textPrimary, fontWeight: '700' },
  colorRole: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  difficultyRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  difficultyBtn: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  difficultyBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  difficultyLabel: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  difficultyLabelActive: { color: Colors.white },
  difficultySub: { color: Colors.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  startBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
});
