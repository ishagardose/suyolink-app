import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
export default function QuickServices({ actions, onAction }) {
  const { colors } = useTheme();
  return <View style={styles.grid}>{actions.map(item => {
    const primary = item.id === 'post';
    const ink = primary ? colors.onPrimary : colors.text;
    return <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={item.title}
      onPress={() => onAction(item.id)} activeOpacity={0.8}
      style={[styles.card, { backgroundColor: primary ? colors.primary : colors.surfaceAlt, borderColor: primary ? colors.primary : colors.border }]}>
      <View style={styles.top}><Ionicons name={primary ? 'add-circle-outline' : 'bicycle-outline'} size={28} color={ink} />
        <Ionicons name="arrow-forward-outline" size={18} color={ink} style={{ transform: [{ rotate: '-45deg' }] }} /></View>
      <ThemedText style={[styles.title, { color: ink }]}>{item.title}</ThemedText>
      <ThemedText style={{ fontSize: 12, lineHeight: 18, color: primary ? colors.heroTextMuted : colors.textMuted }}>{primary ? 'Get a helping hand' : 'Help someone nearby'}</ThemedText>
    </TouchableOpacity>;
  })}</View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 12, marginBottom: 22 }, card: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 18, gap: 5 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, title: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
});
