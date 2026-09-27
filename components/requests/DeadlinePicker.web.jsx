import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { localDeadline } from '../../lib/deadline';
export default function DeadlinePicker({ value, onChange, disabled }) {
  const { colors } = useTheme();
  return <input aria-label="Deadline" type="datetime-local" value={value.replace(' ', 'T')}
    min={localDeadline(new Date(Date.now() + 60000)).replace(' ', 'T')} disabled={disabled}
    onChange={event => onChange(event.target.value.replace('T', ' '))}
    style={{ width: '100%', boxSizing: 'border-box', minHeight: 48, padding: 12, borderRadius: 12,
      border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, font: 'inherit' }} />;
}
