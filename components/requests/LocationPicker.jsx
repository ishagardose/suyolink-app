import React, { useEffect } from 'react';
import { View } from 'react-native';
import TaskMap from '../maps/TaskMap';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function LocationPicker({ value, onChange, disabled }) {
  const { position, locate, loading, error } = useDeviceLocation();
  const { colors } = useTheme();
  useEffect(() => {
    if (position && !value && !disabled) onChange(position);
  }, [position, value, disabled, onChange]);
  return <View style={{ gap: 10 }}>
    <ThemedText style={{ fontWeight: '700' }}>Task location pin</ThemedText>
    <ThemedText tone="textMuted">Your browsing area sets the initial pin. Move it by tapping the map if the task starts elsewhere. The task pin will be visible with your request.</ThemedText>
    <View pointerEvents={disabled ? 'none' : 'auto'}>
      <TaskMap center={value || position} onPick={disabled ? undefined : onChange}
        markers={value ? [{ ...value, id: 'task', title: 'Task location' }] : []} />
    </View>
    <ThemedButton title="Use my current location" onPress={async () => { const next = await locate(); if (next) onChange(next); }}
      loading={loading} disabled={disabled} textStyle={{ color: colors.white }} />
    {value ? <ThemedText accessibilityLabel="Selected task coordinates">Pin selected: {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</ThemedText>
      : <ThemedText tone="textMuted">Choose a pin before posting.</ThemedText>}
    {error ? <ThemedText tone="danger" accessibilityRole="alert">{error}</ThemedText> : null}
  </View>;
}
