import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ThemedButton from '../themed/ThemedButton';
import { localDeadline } from '../../lib/deadline';
export default function DeadlinePicker({ value, onChange, disabled }) {
  const [mode, setMode] = useState(null);
  const date = value ? new Date(value.replace(' ', 'T')) : new Date(Date.now() + 3600000);
  return <View style={{ gap: 8 }}>
    <ThemedButton variant="secondary" title={value ? date.toLocaleDateString() : 'Choose date'} disabled={disabled} onPress={() => setMode('date')} />
    <ThemedButton variant="secondary" title={value ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Choose time'} disabled={disabled} onPress={() => setMode('time')} />
    {mode && !disabled ? <DateTimePicker value={date} mode={mode} minimumDate={mode === 'date' ? new Date() : undefined}
      onChange={(event, selected) => {
        if (Platform.OS === 'android') setMode(null);
        if (event.type !== 'dismissed' && selected) onChange(localDeadline(selected));
      }} /> : null}
    {mode && Platform.OS === 'ios' ? <ThemedButton title="Done" onPress={() => setMode(null)} /> : null}
  </View>;
}
