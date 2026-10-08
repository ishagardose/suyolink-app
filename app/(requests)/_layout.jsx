import React from 'react';
import RequireLocation from '../../components/onboarding/RequireLocation';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function RequestsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      initialRouteName="post-suyo"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="post-suyo" />
      <Stack.Screen name="suyo" />
      <Stack.Screen name="fulfill" />
      <Stack.Screen name="requester-fulfill" />
      <Stack.Screen name="submit-proof" />
      <Stack.Screen name="proof" />
      <Stack.Screen name="review-proof" />
      <Stack.Screen name="rate-suyo" />
      <Stack.Screen name="rate-doer" />
      <Stack.Screen name="rate-requester" />
    </Stack>
  );
}
