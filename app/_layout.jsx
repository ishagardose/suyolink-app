import React, { useEffect } from 'react';
import { Stack, useRouter, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SuyoProvider } from '../context/SuyoContext';
import { LocationProvider } from '../context/LocationContext';

// ⚠️ DEV PREVIEW: set to false to restore normal login-required auth flow
const DEV_PREVIEW = true;

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { isLoggedIn: _isLoggedIn, isLoading } = useAuth();
  const isLoggedIn = DEV_PREVIEW ? true : _isLoggedIn;
  const { colors, isDark, isLoading: themeLoading } = useTheme();
  const ready = !isLoading && !themeLoading;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  // Restore local state before evaluating guards, including for deep links.
  if (!ready) return null;
  // DEV PREVIEW: skip splash + auth and go straight to dashboard
  if (DEV_PREVIEW) {
    return (
      <>
        <StatusBar style="light" />
        <Stack
          initialRouteName="dashboard"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="post-suyo" />
          <Stack.Screen name="suyo" />
          <Stack.Screen name="map" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </>
    );
  }
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
        <Stack.Screen name="verify-email" />
        <Stack.Screen
          name="(auth)"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="post-suyo" />
          <Stack.Screen name="suyo" />
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
        <LocationProvider><SuyoProvider>
          <AppNavigator />
        </SuyoProvider></LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
