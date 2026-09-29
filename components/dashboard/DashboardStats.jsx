import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
export default function DashboardStats({ stats, onViewActivity }) {
  const { colors } = useTheme();
  const items = [['Completed', stats.completed], ['Completed offers', stats.earned], ['Active', stats.active]];
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="View task activity" onPress={onViewActivity} activeOpacity={0.8}
    style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    {items.map(([label, value], i) => <View key={label} style={[styles.item, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
      <ThemedText numberOfLines={1} adjustsFontSizeToFit style={styles.value}>{value}</ThemedText>
      <ThemedText style={[styles.label, { color: colors.textMuted }]}>{label}</ThemedText>
    </View>)}
  </TouchableOpacity>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, paddingVertical: 16, marginBottom: 20 },
  item: { flex: 1, alignItems: 'center', paddingHorizontal: 6, gap: 5 }, value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }, label: { fontSize: 10, textAlign: 'center' } });
