import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="map" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
