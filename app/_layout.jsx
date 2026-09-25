import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding before component tree is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen seamlessly once root is ready
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ contentStyle: { backgroundColor: '#163523' } }}
        />
        <Stack.Screen
          name="signup"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="login"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="otp-verification" />
        <Stack.Screen name="id-verification" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="welcome" />
        <Stack.Screen
          name="dashboard"
          options={{
            contentStyle: { backgroundColor: '#163523' },
          }}
        />
        <Stack.Screen
          name="map"
          options={{
            contentStyle: { backgroundColor: '#163523' },
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
