import React from 'react';
import RequireLocation from '../../components/onboarding/RequireLocation';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function WalletLayout() {
  const { colors } = useTheme();
  return (
    <RequireLocation>
      <Stack
        initialRouteName="wallet"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="wallet" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="transactions" />
      </Stack>
    </RequireLocation>
  );
}
