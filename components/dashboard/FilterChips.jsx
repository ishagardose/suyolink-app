import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
export default function FilterChips({ items, value, onChange }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {items.map(([id, label]) => (
        <TouchableOpacity
          key={id}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: value === id }}
          onPress={() => onChange(id)}
          style={{
            minHeight: 40,
            justifyContent: 'center',
            paddingHorizontal: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: value === id ? colors.primary : colors.border,
            backgroundColor: value === id ? colors.primary : colors.card,
          }}
        >
          <ThemedText
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: value === id ? colors.onPrimary : colors.textMuted,
            }}
          >
            {label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
