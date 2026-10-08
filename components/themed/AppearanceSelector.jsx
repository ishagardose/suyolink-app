import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const options = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function AppearanceSelector() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [error, setError] = useState('');

  async function selectMode(mode) {
    setError('');
    try {
      await setThemeMode(mode);
    } catch (_) {
      setError('Could not save appearance. Please retry.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Appearance"
          style={[styles.options, { backgroundColor: colors.surfaceAlt }]}
        >
          {options.map(({ mode, label, icon }) => {
            const selected = themeMode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="radio"
                accessibilityLabel={`${label} appearance`}
                accessibilityHint={
                  mode === 'system'
                    ? 'Follow your device appearance'
                    : `Use ${label.toLowerCase()} mode`
                }
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                onPress={() => selectMode(mode)}
                style={({ pressed, hovered, focused }) => [
                  styles.option,
                  {
                    backgroundColor: selected
                      ? colors.card
                      : hovered
                        ? colors.surfaceHover
                        : 'transparent',
                    borderColor: focused
                      ? colors.link
                      : selected
                        ? colors.hoverBorder
                        : 'transparent',
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={selected ? colors.link : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  title: { fontSize: 15, fontWeight: '700' },
  options: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14 },
  option: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 11, lineHeight: 16 },
});
