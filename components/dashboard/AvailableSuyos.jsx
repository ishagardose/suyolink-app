import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import TaskCard from '../cards/TaskCard';

export default function AvailableSuyos({ suyos }) {
  const { colors } = useTheme();
  const { isLoading, error, reload } = useSuyos();
  return (
    <View style={styles.section}>
      <ThemedText style={styles.heading}>Available suyos</ThemedText>
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
              No suyos yet. Tap Post a Suyo to create your first request.
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
