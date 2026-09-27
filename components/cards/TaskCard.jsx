import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { formatOffer, STATUS_LABELS } from '../../data/suyoRequests';
import ThemedText from '../themed/ThemedText';
import { distanceKm, formatDistance } from '../../lib/geo';
import { useDeviceLocation } from '../../context/LocationContext';
import { useRouter } from 'expo-router';
import ThemedButton from '../themed/ThemedButton';

export default function TaskCard({ suyo }) {
  const { colors } = useTheme();
  const { position } = useDeviceLocation();
  const router = useRouter();
  const distance = distanceKm(position, suyo);
  const [expanded, setExpanded] = useState(false);
  const expired =
    suyo.status === 'open' && Date.parse(suyo.deadline) <= Date.now();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <ThemedText style={styles.title}>{suyo.title}</ThemedText>
        <ThemedText style={styles.amount}>
          {formatOffer(suyo.offerCentavos)}
        </ThemedText>
      </View>
      <ThemedText style={{ color: colors.textMuted }}>
        {suyo.category} · {suyo.location}
      </ThemedText>
      <View style={styles.row}>
        <ThemedText style={{ color: expired ? colors.danger : colors.text }}>
          {expired ? 'Deadline passed' : STATUS_LABELS[suyo.status]}
        </ThemedText>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            (expanded ? 'Hide' : 'Show') + ' details for ' + suyo.title
          }
          onPress={() => setExpanded(!expanded)}
        >
          <ThemedText style={{ color: colors.text, fontWeight: '700' }}>
            {expanded ? 'Hide details' : 'Details'}
          </ThemedText>
        </TouchableOpacity>
      </View>
      <ThemedText style={{ color: colors.textMuted }}>
        Due: {new Date(suyo.deadline).toLocaleString()}
      </ThemedText>
      {expanded && (
        <View style={styles.details}>
          <ThemedText>{suyo.details}</ThemedText>
          {suyo.notes ? <ThemedText>Notes: {suyo.notes}</ThemedText> : null}
          <ThemedText style={{ color: colors.textMuted }}>
            Posted by {suyo.requesterName}
          </ThemedText>
        </View>
      )}
      {distance !== null ? <ThemedText>{formatDistance(distance)} (straight-line)</ThemedText> : null}
      <ThemedButton title="Open task" accessibilityLabel={'Open task ' + suyo.title} onPress={() => router.push({ pathname: '/suyo', params: { id: suyo.id } })} />
      {Number.isFinite(suyo.latitude) && Number.isFinite(suyo.longitude) ?
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={'View location for ' + suyo.title}
          onPress={() => router.push({ pathname: '/map', params: { requestId: suyo.id } })}>
          <ThemedText style={{ fontWeight: '700' }}>View on map</ThemedText>
        </TouchableOpacity> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 9 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  amount: { fontSize: 14, fontWeight: '700' },
  details: { gap: 8, paddingTop: 4 },
});
