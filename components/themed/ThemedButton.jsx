import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from './ThemedText';
export default function ThemedButton({ title, variant = 'primary', loading = false, disabled = false, style, textStyle, accessibilityState, ...props }) {
  const { colors } = useTheme();
  const foreground = variant === 'primary' ? colors.onPrimary : colors.link;
  return (
    <TouchableOpacity {...props} accessibilityRole="button" accessibilityState={{ ...accessibilityState, disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading} activeOpacity={0.8}
      style={[styles.button, { backgroundColor: variant === 'primary' ? colors.primary : colors.surfaceAlt,
        opacity: disabled || loading ? 0.65 : 1 }, style]}>
      {loading ? <ActivityIndicator color={foreground} /> : <ThemedText style={[styles.text, { color: foreground }, textStyle]}>{title}</ThemedText>}
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, fontWeight: '700' },
});
