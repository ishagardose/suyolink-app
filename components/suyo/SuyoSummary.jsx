import { useDeviceLocation } from '../../context/LocationContext';
import { distanceKm } from '../../lib/geo';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { formatOffer, STATUS_LABELS } from '../../data/suyoRequests';
import ThemedText from '../themed/ThemedText';
import { urgencyFor } from '../../lib/urgency';

export default function SuyoSummary({ details }) {
  const { colors } = useTheme();
  const { position } = useDeviceLocation();
  if (!details) return null;
  const km = distanceKm(position, details);

  const urgency = urgencyFor(details.deadline);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.category, { color: colors.textMuted }]}>
          {details.category?.toUpperCase()}
        </ThemedText>
        <View style={styles.badgeRow}>
          {urgency ? (
            <View style={[styles.urgencyBadge, { backgroundColor: colors.danger }]}>
              <ThemedText style={styles.urgencyText}>{urgency.label}</ThemedText>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
            <ThemedText style={[styles.badgeText, { color: colors.link }]}>
              {STATUS_LABELS[details.status] || details.status}
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText style={styles.title}>{details.title}</ThemedText>
      <ThemedText style={[styles.amount, { color: colors.link }]}>
        {formatOffer(details.offerCentavos)}
      </ThemedText>

      <ThemedText style={styles.details}>{details.details}</ThemedText>

      {details.notes ? (
        <ThemedText tone="textMuted" style={styles.notes}>
          Notes: {details.notes}
        </ThemedText>
      ) : null}

      <View style={[styles.metaSection, { borderTopColor: colors.border }]}>
        <ThemedText tone="textMuted" style={styles.metaItem}>
          Area: {details.location}{km != null ? ` - approximately ${km.toFixed(1)} km away` : ''}
        </ThemedText>
        <ThemedText tone="textMuted" style={styles.metaItem}>
          Deadline: {new Date(details.deadline).toLocaleString()}
        </ThemedText>
        <ThemedText tone="textMuted" style={styles.metaItem}>
          Posted by: {details.requesterName}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  details: {
    fontSize: 15,
    lineHeight: 22,
  },
  notes: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  metaSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  metaItem: {
    fontSize: 13,
  },
});
