import React from 'react';
import RequireLocation from '../../components/onboarding/RequireLocation';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function AccountLayout() {
  const { colors } = useTheme();
  return (
    <RequireLocation>
      <Stack
        initialRouteName="account"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="account" />
        <Stack.Screen name="profile" />
      </Stack>
    </RequireLocation>
  );
}
