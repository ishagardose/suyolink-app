import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function ThemedText({ tone = 'text', style, ...props }) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: colors[tone] }, style]} />;
}
