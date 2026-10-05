import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';

export default function LocationAcknowledgment({
  checked,
  onChange,
  disabled = false,
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel="Location acknowledgment"
      aria-checked={checked}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        alignItems: 'flex-start',
        minHeight: 48,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: checked ? colors.link : colors.border,
          backgroundColor: checked ? colors.primary : colors.input,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? (
          <Ionicons
            name="checkmark"
            size={17}
            color={colors.onPrimary}
          />
        ) : null}
      </View>
      <ThemedText style={{ flex: 1, fontSize: 12, lineHeight: 19 }}>
        I acknowledge that SuyoLink saves my selected area to my account to help
        me find nearby tasks. I can change this area later.
      </ThemedText>
    </TouchableOpacity>
  );
}
