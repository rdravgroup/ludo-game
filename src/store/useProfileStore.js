// src/store/useProfileStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncProfileToCloud, fetchCloudProfile } from '../utils/LeaderboardService';
import { getCurrentFirebaseUser } from '../utils/AuthService';

const PROFILE_KEY = '@ludo/profile';

const defaultProfile = {
  uid: null,
  username: 'Player',
  avatarId: 0,
  authProvider: null, // 'google' | 'apple' | null (guest)
  stats: {
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    tokensCaptured: 0,
  },
  soundEnabled: true,
  musicEnabled: true,
  themeMode: 'dark', // 'dark' | 'light'
};

/** Merge two stat sets by taking the higher value per field — used when
 * reconciling local vs cloud copies so neither device's progress is lost. */
function mergeStatsPreferHigher(localStats, cloudStats) {
  if (!cloudStats) return localStats;
  return {
    wins: Math.max(localStats.wins, cloudStats.wins ?? 0),
    losses: Math.max(localStats.losses, cloudStats.losses ?? 0),
    gamesPlayed: Math.max(localStats.gamesPlayed, cloudStats.gamesPlayed ?? 0),
    tokensCaptured: Math.max(localStats.tokensCaptured, cloudStats.tokensCaptured ?? 0),
  };
}

export const useProfileStore = create((set, get) => ({
  profile: defaultProfile,
  loaded: false,
  syncing: false,

  loadProfile: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      const localProfile = raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
      set({ profile: localProfile, loaded: true });

      // If already signed in (persisted Firebase session) and a uid is on
      // the local profile, reconcile with the cloud copy so progress made
      // on another device isn't lost.
      const firebaseUser = getCurrentFirebaseUser();
      if (firebaseUser && localProfile.authProvider) {
        await get().reconcileWithCloud(firebaseUser.uid);
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
      set({ loaded: true });
    }
  },

  /** Pull cloud stats and merge (take-higher) with local, then save+sync the result. */
  reconcileWithCloud: async (uid) => {
    const cloud = await fetchCloudProfile(uid);
    const current = get().profile;
    const mergedStats = mergeStatsPreferHigher(current.stats, cloud);
    const next = { ...current, uid, stats: mergedStats };
    set({ profile: next });
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to persist reconciled profile', e);
    }
    syncProfileToCloud(next);
  },

  saveProfile: async (partial) => {
    const next = { ...get().profile, ...partial };
    set({ profile: next });
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
    // Fire-and-forget cloud sync — never blocks the UI, and silently
    // no-ops if the user isn't signed in or Firebase isn't configured.
    if (next.authProvider) {
      syncProfileToCloud(next);
    }
  },

  recordGameResult: async ({ won, captures = 0 }) => {
    const current = get().profile;
    const stats = {
      ...current.stats,
      gamesPlayed: current.stats.gamesPlayed + 1,
      wins: current.stats.wins + (won ? 1 : 0),
      losses: current.stats.losses + (won ? 0 : 1),
      tokensCaptured: current.stats.tokensCaptured + captures,
    };
    await get().saveProfile({ stats });
  },

  toggleSound: async () => {
    await get().saveProfile({ soundEnabled: !get().profile.soundEnabled });
  },

  toggleMusic: async () => {
    await get().saveProfile({ musicEnabled: !get().profile.musicEnabled });
  },

  setThemeMode: async (mode) => {
    await get().saveProfile({ themeMode: mode === 'light' ? 'light' : 'dark' });
  },
}));
