// src/screens/GameScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Board from '../components/Board';
import Token from '../components/Token';
import Dice from '../components/Dice';
import Scoreboard from '../components/Scoreboard';
import WinCelebration from '../components/WinCelebration';
import ChatBox from '../components/ChatBox';

import { Colors, Spacing, Radius, Typography } from '../theme/Theme';
import { PLAYER_THEME, GRID_SIZE } from '../utils/BoardConfig';
import { useGameStore } from '../store/useGameStore';
import { useProfileStore } from '../store/useProfileStore';
import { SoundManager } from '../utils/SoundManager';
import { aiThinkingDelay } from '../utils/AI';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_W - Spacing.md * 2, SCREEN_H * 0.58);
const CELL_PX = BOARD_SIZE / GRID_SIZE;

export default function GameScreen({ navigation }) {
  const {
    state,
    pendingMoves,
    aiColors,
    aiDifficulty,
    rollCurrentDice,
    selectMove,
    playAITurn,
    skipTurnNoMoves,
    pauseGame,
    resumeGame,
    clearSavedGame,
  } = useGameStore();
  const { profile, recordGameResult } = useProfileStore();

  const [isRolling, setIsRolling] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [highlightedTokenId, setHighlightedTokenId] = useState(null);
  const captureCountRef = useRef(0);

  const currentColor = state ? state.activeColors[state.currentTurnIndex] : null;
  const isAITurn = currentColor && aiColors.includes(currentColor);

  // Drive AI turns automatically.
  useEffect(() => {
    if (!state || state.status !== 'PLAYING') return;
    if (!isAITurn) return;
    if (state.diceRolled) return; // mid-resolution already

    const timer = setTimeout(() => {
      runAITurn();
    }, aiThinkingDelay(aiDifficulty));

    return () => clearTimeout(timer);
  }, [state?.currentTurnIndex, state?.status, isAITurn]);

  const runAITurn = useCallback(() => {
    setIsRolling(true);
    SoundManager.play('diceRoll');
    setTimeout(() => {
      const outcome = playAITurn();
      setIsRolling(false);
      handleOutcomeSideEffects(outcome);
    }, 650);
  }, [playAITurn]);

  const handleRollPress = useCallback(() => {
    if (!state || state.diceRolled || isAITurn || state.status !== 'PLAYING') return;
    setIsRolling(true);
    SoundManager.play('diceRoll');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => {
      const rollResult = rollCurrentDice();
      setIsRolling(false);
      if (rollResult && rollResult.moves.length === 0) {
        // No legal moves — auto pass after a short beat so the player sees the dice value.
        setTimeout(() => skipTurnNoMoves(), 700);
      }
    }, 650);
  }, [state, isAITurn, rollCurrentDice, skipTurnNoMoves]);

  const handleTokenPress = useCallback(
    (tokenId) => {
      if (!state || isAITurn || state.status !== 'PLAYING') return;
      if (!pendingMoves.find((m) => m.tokenId === tokenId)) return;

      SoundManager.play('tokenMove');
      setHighlightedTokenId(tokenId);
      const outcome = selectMove(tokenId);
      handleOutcomeSideEffects(outcome);
    },
    [state, isAITurn, pendingMoves, selectMove]
  );

  const handleOutcomeSideEffects = (outcome) => {
    if (!outcome) return;
    if (outcome.result?.capture) {
      captureCountRef.current += 1;
      SoundManager.play('capture');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    if (outcome.result?.tokenReachedHome) {
      SoundManager.play('tokenHome');
    }
    if (outcome.isOver) {
      SoundManager.play('win');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const humanWon = outcome.winner && !aiColors.includes(outcome.winner);
      recordGameResult({ won: humanWon, captures: captureCountRef.current });
      clearSavedGame();
    }
  };

  const handlePause = () => {
    pauseGame();
  };

  const handleExitConfirm = () => {
    Alert.alert('Exit Match', 'Your progress is saved automatically. Exit anyway?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit',
        style: 'destructive',
        onPress: () => navigation.navigate('Home'),
      },
    ]);
  };

  const handlePlayAgain = () => {
    clearSavedGame();
    navigation.navigate('PlayerSetup', { mode: state.mode === 'ai' ? 'ai' : 'local' });
  };

  const handleSendChat = (msg) => {
    setChatMessages((prev) => [
      ...prev,
      {
        sender: profile.username,
        color: currentColor,
        content: msg.content,
        timestamp: Date.now(),
      },
    ]);
  };

  if (!state) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={Typography.body}>No active game.</Text>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={{ color: Colors.primary, marginTop: Spacing.md }}>Go Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const allTokens = state.activeColors.flatMap((color) => state.tokens[color]);
  const diceColor = currentColor ? PLAYER_THEME[currentColor].primary : Colors.accent;

  return (
    <LinearGradient colors={Colors.backgroundGradient} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={handlePause}>
            <Text style={styles.iconText}>⏸</Text>
          </Pressable>
          <Text style={styles.turnLabel}>
            {isAITurn
              ? `${currentColor} (AI${state.mode === 'ai' ? ` · ${aiDifficulty}` : ''}) is thinking…`
              : `${currentColor}'s turn`}
          </Text>
          {state.mode === 'online' ? (
            <Pressable style={styles.iconBtn} onPress={() => setChatVisible(true)}>
              <Text style={styles.iconText}>💬</Text>
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>

        <Scoreboard
          activeColors={state.activeColors}
          tokens={state.tokens}
          currentColor={currentColor}
        />

        <View style={styles.boardWrap}>
          <View style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
            <Board size={BOARD_SIZE} />
            {allTokens.map((token) => (
              <Token
                key={token.id}
                token={token}
                cellSizePx={CELL_PX}
                isMovable={
                  !isAITurn &&
                  state.status === 'PLAYING' &&
                  pendingMoves.some((m) => m.tokenId === token.id)
                }
                highlight={highlightedTokenId === token.id}
                onPress={handleTokenPress}
              />
            ))}
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.diceWrap}>
            <Dice
              value={state.diceValue}
              isRolling={isRolling}
              disabled={isAITurn || state.diceRolled || state.status !== 'PLAYING'}
              onPress={handleRollPress}
              color={diceColor}
            />
            <Text style={styles.diceHint}>
              {state.diceRolled
                ? pendingMoves.length > 0
                  ? 'Tap a glowing token to move'
                  : 'No legal moves — passing turn'
                : isAITurn
                ? ''
                : 'Tap dice to roll'}
            </Text>
          </View>

          <Pressable style={styles.exitBtn} onPress={handleExitConfirm}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>

        {state.status === 'PAUSED' && (
          <PauseOverlay onResume={resumeGame} onExit={handleExitConfirm} />
        )}

        <WinCelebration
          visible={state.status === 'WON'}
          winnerColor={state.winner}
          winnerName={
            state.winner === currentColor && !isAITurn
              ? profile.username
              : `${state.winner}`
          }
          onPlayAgain={handlePlayAgain}
          onExit={() => navigation.navigate('Home')}
        />

        <ChatBox
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          messages={chatMessages}
          onSend={handleSendChat}
          myColor={currentColor}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function PauseOverlay({ onResume, onExit }) {
  return (
    <View style={styles.pauseOverlay}>
      <View style={styles.pauseCard}>
        <Text style={styles.pauseTitle}>Paused</Text>
        <Pressable style={styles.pauseBtn} onPress={onResume}>
          <Text style={Typography.button}>Resume</Text>
        </Pressable>
        <Pressable style={[styles.pauseBtn, styles.pauseBtnSecondary]} onPress={onExit}>
          <Text style={[Typography.button, { color: Colors.textPrimary }]}>Exit to Menu</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18, color: Colors.textPrimary },
  turnLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 },
  boardWrap: { alignItems: 'center', marginTop: Spacing.md },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  diceWrap: { alignItems: 'center' },
  diceHint: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm, textAlign: 'center' },
  exitBtn: {
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
  },
  exitText: { color: Colors.danger, fontWeight: '700' },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: 'rgba(10,5,25,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCard: {
    width: SCREEN_W * 0.7,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pauseTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: Spacing.sm },
  pauseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    width: '100%',
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  pauseBtnSecondary: { backgroundColor: Colors.surfaceElevated },
});
