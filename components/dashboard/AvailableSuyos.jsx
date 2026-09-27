import React from 'react';
import { StyleSheet, View } from 'react-native';
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
      <ThemedText style={styles.heading}>Available suyos</ThemedText>
      <ThemedButton title="Explore request map" onPress={() => router.push('/map')} textStyle={{ color: colors.white }} style={{ marginBottom: 12 }} />
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
            <ThemedText style={{ color: colors.textMuted }}>
              No available suyos match this view. Try other filters or post a request.
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 20, paddingBottom: 12 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  list: { gap: 10 },
});
