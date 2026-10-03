import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { formatOffer, STATUS_LABELS } from '../../data/suyoRequests';
import ThemedText from '../themed/ThemedText';
import { distanceKm, formatDistance } from '../../lib/geo';
import { urgencyFor } from '../../lib/urgency';
import { useDeviceLocation } from '../../context/LocationContext';
import { useRouter } from 'expo-router';
import ThemedButton from '../themed/ThemedButton';

export default function TaskCard({ suyo }) {
  const { colors } = useTheme();
  const { position } = useDeviceLocation();
  const router = useRouter();
  const distance = distanceKm(position, suyo);
  const [expanded, setExpanded] = useState(false);
  const expired = suyo.status === 'open' && Date.parse(suyo.deadline) <= Date.now();
  const urgency = urgencyFor(suyo.deadline);
  const meta = (icon, text) => <View style={styles.meta}>
    <Ionicons name={icon} size={14} color={colors.textMuted} />
    <ThemedText style={[styles.metaText, { color: colors.textMuted }]}>{text}</ThemedText>
  </View>;
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.row}>
      <ThemedText style={[styles.category, { color: colors.textMuted }]}>{suyo.category.toUpperCase()}</ThemedText>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {urgency ? (
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <ThemedText style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{urgency.label}</ThemedText>
          </View>
        ) : null}
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: expired ? colors.danger : colors.accent }} />
          <ThemedText style={{ fontSize: 10, fontWeight: '700', color: expired ? colors.danger : colors.link }}>{expired ? 'Deadline passed' : STATUS_LABELS[suyo.status]}</ThemedText>
        </View>
      </View>
    </View>
    <View style={styles.row}>
      <ThemedText style={styles.title}>{suyo.title}</ThemedText>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <ThemedText style={[styles.amount, { color: colors.link }]}>{formatOffer(suyo.offerCentavos)}</ThemedText>
        <ThemedText style={{ fontSize: 10, color: colors.textMuted }}>offered</ThemedText>
      </View>
    </View>
    {meta('location-outline', suyo.location)}
    {meta('time-outline', 'Due: ' + new Date(suyo.deadline).toLocaleString())}
    {distance !== null ? meta('navigate-outline', formatDistance(distance) + ' (straight-line)') : null}
    {expanded ? <View style={[styles.details, { borderColor: colors.border }]}>
      <ThemedText style={{ lineHeight: 22 }}>{suyo.details}</ThemedText>
      {suyo.notes ? <ThemedText>Notes: {suyo.notes}</ThemedText> : null}
      <ThemedText tone="textMuted">Posted by {suyo.requesterName}</ThemedText>
    </View> : null}
    <View style={[styles.actions, { borderColor: colors.border }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={(expanded ? 'Hide' : 'Show') + ' details for ' + suyo.title}
        onPress={() => setExpanded(!expanded)} style={styles.textButton}>
        <ThemedText style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{expanded ? 'Hide details' : 'Details'}</ThemedText>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
      </TouchableOpacity>
      {Number.isFinite(suyo.latitude) && Number.isFinite(suyo.longitude) ? <TouchableOpacity accessibilityRole="button"
        accessibilityLabel={'View location for ' + suyo.title} style={styles.textButton}
        onPress={() => router.push({ pathname: '/map', params: { requestId: suyo.id } })}>
        <Ionicons name="map-outline" size={15} color={colors.link} /><ThemedText style={{ fontSize: 12, color: colors.link, fontWeight: '600' }}>Map</ThemedText>
      </TouchableOpacity> : null}
      <ThemedButton title="Open task" accessibilityLabel={'Open task ' + suyo.title} style={{ marginLeft: 'auto', minHeight: 44, paddingVertical: 8 }}
        onPress={() => router.push({ pathname: '/suyo', params: { id: suyo.id } })} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 20, borderWidth: 1, gap: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  category: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3, flexShrink: 1 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 }, amount: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  meta: { flexDirection: 'row', gap: 7, alignItems: 'center' }, metaText: { fontSize: 12, lineHeight: 18, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderTopWidth: 1, paddingTop: 12, marginTop: 2 },
  textButton: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 44 }, details: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
});
