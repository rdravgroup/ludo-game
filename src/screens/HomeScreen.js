// src/screens/HomeScreen.js
import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useProfileStore } from '../store/useProfileStore';
import { useGameStore } from '../store/useGameStore';
import { SoundManager } from '../utils/SoundManager';

export default function HomeScreen({ navigation }) {
  const { theme, mode, toggleMode } = useTheme();
  const { profile } = useProfileStore();
  const styles = useStyles(theme);

  useEffect(() => {
    // Profile loading and SoundManager.setEnabled() syncing both happen
    // once at app root (see App.js) so they're correct from the very
    // first screen. We just kick off menu music here, since respecting
    // the musicEnabled setting is now SoundManager's job internally.
    SoundManager.startMusic();
  }, []);

  const handlePress = useCallback(
    (gameMode) => {
      SoundManager.play('buttonTap');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (gameMode === 'online') {
        navigation.navigate('OnlineLobby');
      } else {
        navigation.navigate('PlayerSetup', { mode: gameMode });
      }
    },
    [navigation]
  );

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleMode();
  };

  return (
    <LinearGradient colors={theme.Colors.backgroundGradient} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable style={styles.profileChip} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{AVATARS[profile.avatarId % AVATARS.length]}</Text>
            </View>
            <Text style={styles.username}>{profile.username}</Text>
          </Pressable>

          <View style={styles.topBarRight}>
            <Pressable style={styles.iconBtn} onPress={handleToggleTheme}>
              <Ionicons
                name={mode === 'dark' ? 'sunny' : 'moon'}
                size={20}
                color={theme.Colors.textPrimary}
              />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Leaderboard')}>
              <Ionicons name="trophy" size={20} color={theme.Colors.accent} />
            </Pressable>
          </View>
        </View>

        <View style={styles.center}>
          <Text style={styles.logo}>🎲</Text>
          <Text style={styles.heading}>Ludo Royale</Text>
          <Text style={styles.tagline}>Roll. Race. Rule the Board.</Text>
        </View>

        <View style={styles.menu}>
          <MenuButton
            theme={theme}
            icon="people"
            label="Pass & Play"
            sub="2-4 players, one device"
            color={theme.Colors.primary}
            gameMode="local"
            onPress={handlePress}
          />
          <MenuButton
            theme={theme}
            icon="hardware-chip"
            label="Vs AI"
            sub="Practice against the computer"
            color={theme.Colors.success}
            gameMode="ai"
            onPress={handlePress}
          />
          <MenuButton
            theme={theme}
            icon="globe"
            label="Play Online"
            sub="Real-time matches with friends"
            color={theme.Colors.accent}
            gameMode="online"
            onPress={handlePress}
          />
          <ResumeButton navigation={navigation} theme={theme} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const ResumeButton = React.memo(function ResumeButton({ navigation, theme }) {
  const loadSavedGame = useGameStore((s) => s.loadSavedGame);
  const styles = useStyles(theme);

  const handleResume = async () => {
    const found = await loadSavedGame();
    if (found) {
      navigation.navigate('Game', { resumed: true });
    }
  };

  return (
    <Pressable style={styles.resumeBtn} onPress={handleResume}>
      <Ionicons name="refresh" size={14} color={theme.Colors.textSecondary} />
      <Text style={styles.resumeText}>Resume Saved Game</Text>
    </Pressable>
  );
});

const MenuButton = React.memo(function MenuButton({ theme, icon, label, sub, color, gameMode, onPress }) {
  const styles = useStyles(theme);
  return (
    <Pressable
      style={[styles.menuButton, theme.Shadow.button, { borderColor: color }]}
      onPress={() => onPress(gameMode)}
    >
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color={theme.Colors.white} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={color} />
    </Pressable>
  );
});

export const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐸', '🐵', '🦄', '🐲'];

function useStyles(theme) {
  const { Colors, Spacing, Radius, FontFamily } = theme;
  return StyleSheet.create({
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
    },
    topBarRight: { flexDirection: 'row', gap: Spacing.sm },
    profileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 10,
      gap: 8,
    },
    avatarCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarEmoji: { fontSize: 16 },
    username: { color: Colors.textPrimary, fontFamily: FontFamily.bodySemiBold },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: { alignItems: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.xl },
    logo: { fontSize: 64, marginBottom: Spacing.sm },
    heading: {
      fontFamily: FontFamily.headingExtraBold,
      fontSize: 32,
      color: Colors.textPrimary,
      letterSpacing: 0.5,
    },
    tagline: { color: Colors.textSecondary, marginTop: Spacing.xs, fontSize: 14, fontFamily: FontFamily.body },
    menu: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    menuButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuTextWrap: { flex: 1 },
    menuLabel: { color: Colors.textPrimary, fontSize: 17, fontFamily: FontFamily.bodyBold },
    menuSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2, fontFamily: FontFamily.body },
    resumeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: Spacing.sm,
      padding: Spacing.sm,
    },
    resumeText: { color: Colors.textSecondary, fontFamily: FontFamily.bodySemiBold },
  });
}
