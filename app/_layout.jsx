import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SuyoProvider } from '../context/SuyoContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const { colors, isDark, isLoading: themeLoading } = useTheme();
  const ready = !isLoading && !themeLoading;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  // Restore local state before evaluating guards, including for deep links.
  if (!ready) return null;
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="(auth)"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="post-suyo" />
          <Stack.Screen
            name="map"
            options={{ animation: 'slide_from_bottom' }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SuyoProvider>
          <AppNavigator />
        </SuyoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
