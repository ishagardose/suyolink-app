import React from 'react';
import { View } from 'react-native';
import { CATEGORIES } from '../../data/suyoRequests';
import ThemedButton from '../themed/ThemedButton';
import ThemedText from '../themed/ThemedText';
export default function TaskFilters({ category, setCategory, radius, setRadius, due, setDue, hasLocation }) {
  const chips = (options, value, change, prefix) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {options.map(([key, label]) => <ThemedButton key={key} title={label} accessibilityLabel={`${prefix}: ${label}`}
      variant={value === key ? 'primary' : 'secondary'} accessibilityState={{ selected: value === key }}
      disabled={prefix === 'Distance' && key > 0 && !hasLocation} onPress={() => change(key)} />)}
  </View>;
  return <View style={{ gap: 10 }}>
    {chips([['', 'All categories'], ...CATEGORIES.map(value => [value, value])], category, setCategory, 'Category')}
    {chips([[0, 'Any distance'], [1, '1 km'], [5, '5 km'], [10, '10 km']], radius, setRadius, 'Distance')}
    {!hasLocation ? <ThemedText tone="textMuted">Allow location to filter by distance.</ThemedText> : null}
    {chips([[0, 'Any deadline'], [24, 'Within 24 hours'], [168, 'This week']], due, setDue, 'Deadline')}
  </View>;
}
