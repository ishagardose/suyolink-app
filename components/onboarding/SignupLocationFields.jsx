import React, { useRef } from 'react';
import { View } from 'react-native';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';
import TaskMap from '../maps/TaskMap';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import LocationAcknowledgment from './LocationAcknowledgment';

export default function SignupLocationFields({
  selection,
  onSelect,
  acknowledged,
  onAcknowledge,
  disabled,
}) {
  const { colors } = useTheme();
  const { locate, loading, error } = useDeviceLocation();
  const choice = useRef(0);
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        gap: 12,
        marginBottom: 24,
      }}
    >
      <ThemedText
        tone="link"
        style={{ fontSize: 10, letterSpacing: 1.3, fontWeight: '700' }}
      >
        STEP 1 OF 2
      </ThemedText>
      <ThemedText style={{ fontSize: 20, fontWeight: '700' }}>
        Choose your area
      </ThemedText>
      <ThemedText
        tone="textMuted"
        style={{ fontSize: 13, lineHeight: 20 }}
      >
        Set your location before creating an account. Use your current location
        or tap the map to choose an area.
      </ThemedText>
      <ThemedButton
        title="Use my current location"
        disabled={disabled}
        loading={loading}
        onPress={async () => {
          const request = ++choice.current;
          const position = await locate();
          if (position && request === choice.current) {
            onSelect({ position, source: 'device' });
            onAcknowledge(false);
          }
        }}
      />
      <View
        style={{ borderRadius: 14, overflow: 'hidden' }}
        pointerEvents={disabled ? 'none' : 'auto'}
      >
        <TaskMap
          height={220}
          center={selection?.position}
          markers={
            selection
              ? [
                  {
                    ...selection.position,
                    id: 'signup-area',
                    title: 'Your selected area',
                  },
                ]
              : []
          }
          onPick={(position) => {
            choice.current++;
            onSelect({ position, source: 'manual' });
            onAcknowledge(false);
          }}
        />
      </View>
      {selection ? (
        <ThemedText
          accessibilityLabel="Selected area coordinates"
          tone="textMuted"
          style={{ fontSize: 12 }}
        >
          Selected area: {selection.position.latitude.toFixed(5)},{' '}
          {selection.position.longitude.toFixed(5)}
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText
          accessibilityRole="alert"
          tone="danger"
          style={{ fontSize: 12 }}
        >
          {error}
        </ThemedText>
      ) : null}
      <LocationAcknowledgment
        checked={acknowledged}
        onChange={onAcknowledge}
        disabled={disabled}
      />
    </View>
  );
}
