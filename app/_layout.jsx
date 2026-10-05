import React, { useEffect } from 'react';
import { observePush } from '../lib/pushNotifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SuyoProvider } from '../context/SuyoContext';
import { NotificationsModalProvider } from '../context/NotificationsModalContext';
import { LocationProvider } from '../context/LocationContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const { colors, isDark, isLoading: themeLoading } = useTheme();
  const ready = !isLoading && !themeLoading;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    return observePush((id) =>
      router.push({ pathname: '/suyo', params: { id } }),
    );
  }, [ready, isLoggedIn, router]);
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
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(requests)" />
          <Stack.Screen name="(account)" />
          <Stack.Screen name="(wallet)" />
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <SuyoProvider>
            <NotificationsModalProvider>
              <AppNavigator />
            </NotificationsModalProvider>
          </SuyoProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
