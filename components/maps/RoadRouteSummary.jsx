import React from 'react';
import { View } from 'react-native';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function RoadRouteSummary({ routing }) {
  return (
    <View style={{ gap: 8 }}>
      {routing.route ? (
        <ThemedText>
          Driving route: {routing.route.distanceKm.toFixed(2)} km · Estimated{' '}
          {routing.route.minutes} min (no live traffic)
        </ThemedText>
      ) : null}
      {routing.loading ? (
        <ThemedText tone="muted">Loading road route...</ThemedText>
      ) : null}
      {routing.error ? (
        <>
          <ThemedText
            tone="warning"
            accessibilityRole="alert"
          >
            {routing.error}
          </ThemedText>
          <ThemedButton
            title="Retry road route"
            variant="secondary"
            onPress={routing.retry}
          />
        </>
      ) : null}
      {routing.route ? (
        <ThemedText tone="muted">
          Route: OSRM / OpenStreetMap contributors
        </ThemedText>
      ) : null}
    </View>
  );
}
