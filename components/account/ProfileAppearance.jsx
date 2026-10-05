import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import styles from './account.styles';

export default function ProfileAppearance({ onError }) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const card = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];
  return (
    <View style={card}>
      <ThemedText style={styles.sectionTitle}>Make it feel like you</ThemedText>
      <ThemedText
        tone="textMuted"
        style={[styles.description, { marginTop: 6, marginBottom: 18 }]}
      >
        Choose your preferred appearance.
      </ThemedText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Appearance"
        style={styles.inline}
      >
        {[
          ['light', 'sunny-outline'],
          ['dark', 'moon-outline'],
          ['system', 'phone-portrait-outline'],
        ].map(([mode, icon]) => (
          <TouchableOpacity
            key={mode}
            accessibilityRole="radio"
            accessibilityLabel={
              mode[0].toUpperCase() + mode.slice(1) + ' appearance'
            }
            aria-checked={themeMode === mode}
            accessibilityState={{ checked: themeMode === mode }}
            onPress={() => setThemeMode(mode).catch((e) => onError(e.message))}
            style={[
              styles.appearance,
              {
                backgroundColor:
                  themeMode === mode ? colors.surfaceAlt : colors.surface,
                borderColor: themeMode === mode ? colors.link : colors.border,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={23}
              color={themeMode === mode ? colors.link : colors.muted}
            />
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: themeMode === mode ? '700' : '500',
              }}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </ThemedText>
            {themeMode === mode ? (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.link}
                style={{ position: 'absolute', top: 7, right: 7 }}
              />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
