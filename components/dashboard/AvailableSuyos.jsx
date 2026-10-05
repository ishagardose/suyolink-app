import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import TaskCard from '../cards/TaskCard';
import { useRouter } from 'expo-router';

export default function AvailableSuyos({ suyos }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { isLoading, error, reload } = useSuyos();
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <ThemedText tone="textMuted" style={{ fontSize: 12 }}>{suyos.length} {suyos.length === 1 ? 'request' : 'requests'} to explore</ThemedText>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Explore request map" onPress={() => router.push('/map')}
          style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 44 }}>
          <Ionicons name="map-outline" size={16} color={colors.link} /><ThemedText style={{ color: colors.link, fontSize: 12, fontWeight: '700' }}>View map</ThemedText>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ThemedText>Loading requests…</ThemedText>
      ) : error ? (
        <View style={styles.list}>
          <ThemedText
            accessibilityRole="alert"
            style={{ color: colors.danger }}
          >
            {error}
          </ThemedText>
          <ThemedButton
            title="Retry loading requests"
            onPress={reload}
            textStyle={{ color: colors.white }}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {suyos.length ? (
            suyos.map((suyo) => <TaskCard key={suyo.id} suyo={suyo} />)
          ) : (
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 }}>
            <Ionicons name="leaf-outline" size={34} color={colors.textMuted} />
            <ThemedText style={{ color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
              No available suyos match this view. Try other filters or post a request.
            </ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 0, paddingBottom: 12 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  list: { gap: 14 },
});
