import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function AccountLayout() {
  const { colors } = useTheme();
  return (
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
  );
}
