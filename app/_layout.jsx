import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SuyoProvider } from '../context/SuyoContext';
import { LocationProvider, useDeviceLocation } from '../context/LocationContext';

// ⚠️ DEV PREVIEW: set to false to restore normal login-required auth flow
const DEV_PREVIEW = true;

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { isLoggedIn: _isLoggedIn, isLoading } = useAuth();
  const isLoggedIn = DEV_PREVIEW ? true : _isLoggedIn;
  const { isReady: locationReady, hasSavedLocation } = useDeviceLocation();
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark, isLoading: themeLoading } = useTheme();
  const ready = !isLoading && !themeLoading;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  useEffect(() => {
    const needsArea = ['dashboard', 'post-suyo', 'suyo', 'map'].includes(segments[0]);
    if (ready && isLoggedIn && locationReady && !hasSavedLocation && needsArea) router.replace('/set-location');
  }, [ready, isLoggedIn, locationReady, hasSavedLocation, segments, router]);
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
          <Stack.Screen name="account" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="fulfill" />
          <Stack.Screen name="submit-proof" />
          <Stack.Screen name="rate-doer" />
          <Stack.Screen name="rate-requester" />
          <Stack.Screen name="requester-fulfill" />
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
        <Stack.Screen name="forgot-password" />
        <Stack.Screen
          name="(auth)"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="set-location" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="post-suyo" />
          <Stack.Screen name="suyo" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="proof" />
          <Stack.Screen name="review-proof" />
          <Stack.Screen name="rate-suyo" />
          <Stack.Screen name="transactions" />
          <Stack.Screen
            name="map"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="account" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="fulfill" />
          <Stack.Screen name="submit-proof" />
          <Stack.Screen name="rate-doer" />
          <Stack.Screen name="rate-requester" />
          <Stack.Screen name="requester-fulfill" />
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
