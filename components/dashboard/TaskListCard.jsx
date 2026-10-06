import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { formatOffer } from '../../data/suyoRequests';
import useRequestStatusLabel from '../../hooks/useRequestStatusLabel';
import ThemedText from '../themed/ThemedText';
const icons = {
  Delivery: 'bicycle-outline',
  Groceries: 'basket-outline',
  Documents: 'document-text-outline',
  Household: 'home-outline',
  'Queuing & Bills': 'receipt-outline',
  Other: 'sparkles-outline',
};
export default function TaskListCard({ task, onOpen }) {
  const { colors } = useTheme();
  const statusLabel = useRequestStatusLabel(task);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons
            name={icons[task.category] || 'sparkles-outline'}
            size={22}
            color={colors.link}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <ThemedText
            tone="textMuted"
            style={styles.category}
          >
            {task.category}
          </ThemedText>
          <ThemedText style={styles.title}>{task.title}</ThemedText>
        </View>
      </View>
      <ThemedText
        tone="textMuted"
        numberOfLines={2}
        style={{ lineHeight: 21 }}
      >
        {task.details}
      </ThemedText>
      <View style={styles.meta}>
        <Ionicons
          name="location-outline"
          size={15}
          color={colors.muted}
        />
        <ThemedText
          tone="textMuted"
          numberOfLines={1}
          style={{ flex: 1, fontSize: 12 }}
        >
          {task.location}
          {task.distanceKm != null ? ` / ~${task.distanceKm} km` : ''}
        </ThemedText>
      </View>
      <View style={styles.meta}>
        <Ionicons
          name="time-outline"
          size={15}
          color={colors.muted}
        />
        <ThemedText
          tone="textMuted"
          style={{ fontSize: 12 }}
        >
          Due{' '}
          {new Date(task.deadline).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
          ,{' '}
          {new Date(task.deadline).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </ThemedText>
      </View>
      <View style={[styles.footer, { borderColor: colors.border }]}>
        <View>
          <ThemedText
            style={{ fontWeight: '800', fontSize: 23, color: colors.link }}
          >
            {formatOffer(task.offerCentavos)}
          </ThemedText>
          <ThemedText
            tone="textMuted"
            style={{ fontSize: 11 }}
          >
            {statusLabel}
          </ThemedText>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View details"
          onPress={onOpen}
          style={[styles.action, { backgroundColor: colors.surfaceAlt }]}
        >
          <ThemedText
            style={{ fontWeight: '700', fontSize: 13, color: colors.link }}
          >
            View details
          </ThemedText>
          <Ionicons
            name="arrow-forward"
            size={17}
            color={colors.link}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 20, gap: 12, borderRadius: 22, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', lineHeight: 23 },
  category: { fontSize: 11, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 2,
  },
  action: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
