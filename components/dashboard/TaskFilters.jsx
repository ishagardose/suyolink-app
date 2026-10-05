import React from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { CATEGORIES } from '../../data/suyoRequests';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
export default function TaskFilters({ category, setCategory, radius, setRadius, due, setDue, hasLocation }) {
  const { colors } = useTheme();
  const chips = (options, value, change, prefix) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
    {options.map(([key, label]) => {
      const selected = value === key;
      const disabled = prefix === 'Distance' && key > 0 && !hasLocation;
      return <TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={`${prefix}: ${label}`}
        accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => change(key)}
        style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, justifyContent: 'center',
          borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card, opacity: disabled ? 0.45 : 1 }}>
        <ThemedText style={{ fontSize: 12, fontWeight: selected ? '700' : '500', color: selected ? colors.onPrimary : colors.textMuted }}>{label}</ThemedText>
      </TouchableOpacity>;
    })}
  </ScrollView>;
  return <View style={{ gap: 8 }}>
    {chips([['', 'All categories'], ...CATEGORIES.map(value => [value, value])], category, setCategory, 'Category')}
    {chips([[0, 'Any distance'], [1, '1 km'], [5, '5 km'], [10, '10 km']], radius, setRadius, 'Distance')}
    {!hasLocation ? <ThemedText tone="textMuted" style={{ fontSize: 11 }}>Allow location to filter by distance.</ThemedText> : null}
    {chips([[0, 'Any deadline'], [24, 'Within 24 hours'], [168, 'This week']], due, setDue, 'Deadline')}
  </View>;
}
