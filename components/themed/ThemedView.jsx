import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function ThemedView({ tone = 'transparent', style, ...props }) {
  const { colors } = useTheme();
  return <View {...props} style={[{ backgroundColor: colors[tone] ?? 'transparent' }, style]} />;
}
