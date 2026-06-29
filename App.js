// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

import AppNavigator from './src/navigation/AppNavigator';
import { useProfileStore } from './src/store/useProfileStore';
import { SoundManager } from './src/utils/SoundManager';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const loadProfile = useProfileStore((s) => s.loadProfile);

  const [fontsLoaded, fontError] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await SoundManager.init();
        await loadProfile();
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
    if (appReady && (fontsLoaded || fontError)) {
      await SplashScreen.hideAsync();
    }
  }, [appReady, fontsLoaded, fontError]);

  if (fontError) {
    // Fonts failing to load shouldn't hard-crash the app — fall through
    // to the system font rather than blocking the splash screen forever.
    console.warn('Font loading error, falling back to system font:', fontError);
  }

  if (!appReady || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot onLayoutRootView={onLayoutRootView} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Small inner component so it can call useTheme() — the provider has to
 * be a parent, not a sibling, of anything that consumes the context. */
function ThemedRoot({ onLayoutRootView }) {
  const { theme, mode } = useTheme();
  return (
    <View
      style={{ flex: 1, backgroundColor: theme.Colors.background }}
      onLayout={onLayoutRootView}
    >
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </View>
  );
}
