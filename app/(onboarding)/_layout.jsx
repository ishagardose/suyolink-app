import React from 'react';
import RequireLocation from '../../components/onboarding/RequireLocation';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <RequireLocation allowSetup>
      <Stack
        initialRouteName="welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="set-location" />
      </Stack>
    </RequireLocation>
  );
}
