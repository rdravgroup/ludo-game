// src/screens/HomeScreen.js
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme/Theme';
import { useProfileStore } from '../store/useProfileStore';
import { useGameStore } from '../store/useGameStore';
import { SoundManager } from '../utils/SoundManager';

export default function HomeScreen({ navigation }) {
  const { profile } = useProfileStore();

  useEffect(() => {
    // Profile loading and SoundManager.setEnabled() syncing both happen
    // once at app root (see App.js) so they're correct from the very
    // first screen. We just kick off menu music here, since respecting
    // the musicEnabled setting is now SoundManager's job internally.
    SoundManager.startMusic();
  }, []);

  const handlePress = (mode) => {
    SoundManager.play('buttonTap');
    if (mode === 'online') {
      navigation.navigate('OnlineLobby');
    } else {
      navigation.navigate('PlayerSetup', { mode });
    }
  };

  return (
    <LinearGradient colors={Colors.backgroundGradient} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable style={styles.profileChip} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{AVATARS[profile.avatarId % AVATARS.length]}</Text>
            </View>
            <Text style={styles.username}>{profile.username}</Text>
          </Pressable>

          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.iconText}>🏆</Text>
          </Pressable>
        </View>

        <View style={styles.center}>
          <Text style={styles.logo}>🎲</Text>
          <Text style={Typography.heading}>Ludo Royale</Text>
          <Text style={styles.tagline}>Roll. Race. Rule the Board.</Text>
        </View>

        <View style={styles.menu}>
          <MenuButton
            label="Pass & Play"
            sub="2-4 players, one device"
            color={Colors.primary}
            onPress={() => handlePress('local')}
          />
          <MenuButton
            label="Vs AI"
            sub="Practice against the computer"
            color={Colors.success}
            onPress={() => handlePress('ai')}
          />
          <MenuButton
            label="Play Online"
            sub="Real-time matches with friends"
            color={Colors.accent}
            onPress={() => handlePress('online')}
          />
          <ResumeButton navigation={navigation} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ResumeButton({ navigation }) {
  const loadSavedGame = useGameStore((s) => s.loadSavedGame);

  const handleResume = async () => {
    const found = await loadSavedGame();
    if (found) {
      navigation.navigate('Game', { resumed: true });
    }
  };

  return (
    <Pressable style={styles.resumeBtn} onPress={handleResume}>
      <Text style={styles.resumeText}>↻ Resume Saved Game</Text>
    </Pressable>
  );
}

function MenuButton({ label, sub, color, onPress }) {
  return (
    <Pressable style={[styles.menuButton, Shadow.button, { borderColor: color }]} onPress={onPress}>
      <View style={[styles.dotBig, { backgroundColor: color }]} />
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Text style={[styles.chevron, { color }]}>›</Text>
    </Pressable>
  );
}

export const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐸', '🐵', '🦄', '🐲'];

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
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
  username: { color: Colors.textPrimary, fontWeight: '600' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  center: { alignItems: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.xl },
  logo: { fontSize: 64, marginBottom: Spacing.sm },
  tagline: { color: Colors.textSecondary, marginTop: Spacing.xs, fontSize: 14 },
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
  dotBig: { width: 14, height: 14, borderRadius: 7 },
  menuTextWrap: { flex: 1 },
  menuLabel: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  menuSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 26, fontWeight: '300' },
  resumeBtn: { alignItems: 'center', marginTop: Spacing.sm, padding: Spacing.sm },
  resumeText: { color: Colors.textSecondary, fontWeight: '600' },
});
