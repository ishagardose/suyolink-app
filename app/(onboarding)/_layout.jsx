import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
export default function GroupLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="welcome" />
  </Stack>;
}
