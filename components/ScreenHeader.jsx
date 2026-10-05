import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ThemedText from './themed/ThemedText';
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  brand = false,
  hideBorder = false,
}) {
  const { colors } = useTheme();
  const color = brand ? colors.onPrimary : colors.text;
  return (
    <View
      style={[
        styles.header,
        {
          borderBottomWidth: brand || hideBorder ? 0 : 1,
          borderBottomColor: brand || hideBorder ? 'transparent' : colors.border,
          backgroundColor: brand ? colors.brand : colors.card,
        },
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        hitSlop={12}
        style={[
          styles.back,
          {
            backgroundColor: brand ? colors.brand : colors.surfaceAlt,
            borderRadius: 13,
          },
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={color}
        />
      </TouchableOpacity>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color }]}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={{ color }}>{subtitle}</ThemedText>
        ) : null}
      </View>
      <View style={styles.back} />
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  back: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
});
