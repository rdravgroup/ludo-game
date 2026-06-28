// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme/Theme';
import { useProfileStore } from '../store/useProfileStore';
import { AVATARS } from './HomeScreen';
import {
  useGoogleAuthRequest,
  completeGoogleSignIn,
  signInWithApple,
  signOut,
  isGoogleSignInConfigured,
  isAppleSignInAvailableOnDevice,
} from '../utils/AuthService';
import { isFirebaseConfigured } from '../config/firebaseConfig';

export default function ProfileScreen() {
  const { profile, saveProfile, toggleSound, toggleMusic } = useProfileStore();
  const [username, setUsername] = useState(profile.username);
  const [googleRequest, , promptGoogleAsync] = useGoogleAuthRequest();

  const handleSaveUsername = () => {
    if (username.trim()) saveProfile({ username: username.trim() });
  };

  const handleGoogleAuth = async () => {
    if (!isGoogleSignInConfigured()) {
      Alert.alert(
        'Google Sign-In not configured',
        'Add your Firebase + Google OAuth client IDs to .env to enable this. See .env.example.'
      );
      return;
    }
    try {
      const result = await promptGoogleAsync();
      const user = await completeGoogleSignIn(result);
      if (user) {
        const updated = { authProvider: 'google', username: user.name || profile.username, uid: user.uid };
        await saveProfile(updated);
        await useProfileStore.getState().reconcileWithCloud(user.uid);
      }
    } catch (e) {
      Alert.alert('Sign-in failed', e?.message || 'Please try again.');
    }
  };

  const handleAppleAuth = async () => {
    if (!isAppleSignInAvailableOnDevice()) {
      Alert.alert('Not available', 'Sign in with Apple is only available on iOS devices.');
      return;
    }
    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Apple Sign-In not configured',
        'Add your Firebase config to .env to enable this. See .env.example.'
      );
      return;
    }
    try {
      const result = await signInWithApple();
      if (result) {
        const updated = { authProvider: 'apple', username: result.name || profile.username, uid: result.uid };
        await saveProfile(updated);
        await useProfileStore.getState().reconcileWithCloud(result.uid);
      }
    } catch (e) {
      Alert.alert('Sign-in failed', e?.message || 'Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    saveProfile({ authProvider: null });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarEmoji}>{AVATARS[profile.avatarId % AVATARS.length]}</Text>
        </View>
        <View style={styles.avatarPicker}>
          {AVATARS.map((emoji, i) => (
            <Pressable
              key={i}
              style={[styles.avatarOption, profile.avatarId === i && styles.avatarOptionActive]}
              onPress={() => saveProfile({ avatarId: i })}
            >
              <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.usernameRow}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={Colors.textMuted}
          />
          <Pressable style={styles.saveBtn} onPress={handleSaveUsername}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Wins" value={profile.stats.wins} color={Colors.success} />
        <StatCard label="Losses" value={profile.stats.losses} color={Colors.danger} />
        <StatCard label="Games" value={profile.stats.gamesPlayed} color={Colors.primary} />
        <StatCard label="Captures" value={profile.stats.tokensCaptured} color={Colors.accent} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Account</Text>
        {profile.authProvider ? (
          <View style={styles.authRow}>
            <Text style={styles.authStatus}>Signed in via {profile.authProvider}</Text>
            <Pressable onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <Pressable
              style={[styles.authBtn, { backgroundColor: '#fff' }, !isGoogleSignInConfigured() && styles.authBtnDisabled]}
              onPress={handleGoogleAuth}
            >
              <Text style={[styles.authBtnText, { color: '#444' }]}>Continue with Google</Text>
            </Pressable>
            {isAppleSignInAvailableOnDevice() && (
              <Pressable style={[styles.authBtn, { backgroundColor: '#000' }]} onPress={handleAppleAuth}>
                <Text style={[styles.authBtnText, { color: '#fff' }]}> Continue with Apple</Text>
              </Pressable>
            )}
            {!isFirebaseConfigured() && (
              <Text style={styles.configHint}>
                Playing as a guest — sign-in needs Firebase config (see .env.example).
                All other features work fine without it.
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Effects</Text>
          <Switch
            value={profile.soundEnabled}
            onValueChange={toggleSound}
            trackColor={{ true: Colors.primary }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Background Music</Text>
          <Switch
            value={profile.musicEnabled}
            onValueChange={toggleMusic}
            trackColor={{ true: Colors.primary }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, Shadow.card]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  avatarSection: { alignItems: 'center', gap: Spacing.md },
  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarEmoji: { fontSize: 48 },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionActive: { borderColor: Colors.primary },
  avatarOptionEmoji: { fontSize: 20 },
  field: { gap: Spacing.sm },
  label: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  usernameRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  authRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authStatus: { color: Colors.textPrimary },
  signOutText: { color: Colors.danger, fontWeight: '700' },
  authBtn: { borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center' },
  authBtnDisabled: { opacity: 0.5 },
  authBtnText: { fontWeight: '700' },
  configHint: { color: Colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  settingLabel: { color: Colors.textPrimary },
});
