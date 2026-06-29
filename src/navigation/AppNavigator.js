// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import PlayerSetupScreen from '../screens/PlayerSetupScreen';
import OnlineLobbyScreen from '../screens/OnlineLobbyScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { theme, mode } = useTheme();

  const navTheme = {
    dark: mode === 'dark',
    colors: {
      primary: theme.Colors.primary,
      background: theme.Colors.background,
      card: theme.Colors.surface,
      text: theme.Colors.textPrimary,
      border: theme.Colors.border,
      notification: theme.Colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: theme.Colors.surface },
          headerTintColor: theme.Colors.textPrimary,
          headerTitleStyle: { fontFamily: theme.FontFamily.bodyBold },
          contentStyle: { backgroundColor: theme.Colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="PlayerSetup"
          component={PlayerSetupScreen}
          options={{ title: 'Set Up Match' }}
        />
        <Stack.Screen
          name="OnlineLobby"
          component={OnlineLobbyScreen}
          options={{ title: 'Online Lobby' }}
        />
        <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: 'Leaderboard' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
