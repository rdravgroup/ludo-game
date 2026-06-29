// src/theme/ThemeContext.js
//
// Provides the active theme (light or dark) to any component via
// `useTheme()`. The selected mode is persisted through useProfileStore
// (see App.js for the wiring) so it survives app restarts, the same way
// sound/music settings already do.
//
// Usage in a component:
//   import { useTheme } from '../theme/ThemeContext';
//   const { theme, mode, toggleMode } = useTheme();
//   <View style={{ backgroundColor: theme.Colors.background }}>

import React, { createContext, useContext, useMemo } from 'react';
import { getTheme } from './Theme';
import { useProfileStore } from '../store/useProfileStore';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const themeMode = useProfileStore((s) => s.profile.themeMode);
  const setThemeMode = useProfileStore((s) => s.setThemeMode);

  const mode = themeMode || 'dark';

  const value = useMemo(() => {
    const theme = getTheme(mode);
    return {
      mode,
      theme,
      setMode: setThemeMode,
      toggleMode: () => setThemeMode(mode === 'dark' ? 'light' : 'dark'),
    };
  }, [mode, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be called within a <ThemeProvider>. Did you forget to wrap App.js?');
  }
  return ctx;
}
