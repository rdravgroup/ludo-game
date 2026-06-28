// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme/Theme';
import { useProfileStore } from './src/store/useProfileStore';
import { SoundManager } from './src/utils/SoundManager';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const loadProfile = useProfileStore((s) => s.loadProfile);

  useEffect(() => {
    async function prepare() {
      try {
        await SoundManager.init();
        await loadProfile();
        // Place any other startup work here: font loading, asset
        // pre-caching, etc. Example:
        // await Font.loadAsync({ 'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf') });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  // Keep SoundManager's enabled flags in sync with the profile's settings
  // from a single place, so every screen's mute toggle (and the initial
  // load) is reflected immediately without each screen needing its own
  // wiring. Runs once on mount and again any time soundEnabled/musicEnabled
  // change, including the very first load once the real saved values come
  // in from AsyncStorage.
  useEffect(() => {
    const unsubscribe = useProfileStore.subscribe((state) => {
      SoundManager.setEnabled(state.profile.soundEnabled, state.profile.musicEnabled);
    });
    // Apply current values immediately too (covers the case where the
    // subscription is set up after the initial profile load already ran).
    const current = useProfileStore.getState().profile;
    SoundManager.setEnabled(current.soundEnabled, current.musicEnabled);
    return unsubscribe;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <StatusBar style="light" />
          <AppNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
