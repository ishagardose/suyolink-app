import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import FilterChips from './FilterChips';
const SORTS = [['newest', 'Newest'], ['reward_desc', 'Reward: high to low'], ['reward_asc', 'Reward: low to high'], ['urgency', 'Urgent'], ['nearest', 'Nearest']];
export default function DashboardFilters({ visible, onClose, sort, setSort, radius, setRadius, showDistance, onReset }) {
  const { colors } = useTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.backdrop }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: 24, backgroundColor: colors.card, padding: 24, gap: 24 }}>
        <View><ThemedText style={{ fontSize: 24, fontWeight: '700' }}>Refine your search</ThemedText><ThemedText tone="textMuted" style={{ marginTop: 6 }}>Find the right task for your day.</ThemedText></View>
        <ScrollView contentContainerStyle={{ gap: 20 }}>
          <View style={{ gap: 10 }}><ThemedText style={{ fontWeight: '700' }}>Sort by</ThemedText><FilterChips items={SORTS.filter(([id]) => id !== 'nearest' || showDistance)} value={sort} onChange={setSort} /></View>
          {showDistance ? <View style={{ gap: 10 }}><ThemedText style={{ fontWeight: '700' }}>Distance from your area</ThemedText><FilterChips items={ [['', 'Any distance'], ['5', 'Within 5 km'], ['10', 'Within 10 km'], ['25', 'Within 25 km']] } value={radius} onChange={setRadius} /></View> : null}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 12 }}><ThemedButton title="Reset" variant="secondary" onPress={onReset} style={{ flex: 1 }} /><ThemedButton title="Done" onPress={onClose} style={{ flex: 2 }} /></View>
      </View>
    </View>
  </Modal>;
}
