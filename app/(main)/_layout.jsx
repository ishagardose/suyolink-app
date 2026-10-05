import React from 'react';
import RequireLocation from '../../components/onboarding/RequireLocation';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <RequireLocation>
      <Stack
        initialRouteName="dashboard"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen
          name="map"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
    </RequireLocation>
  );
}
