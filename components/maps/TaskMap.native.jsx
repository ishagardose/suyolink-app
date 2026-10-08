import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { DEFAULT_MAP_CENTER, hasCoordinates } from '../../lib/geo';
import { FIXED_COLORS } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function TaskMap({
  center,
  markers = [],
  onPick,
  onSelect,
  height = 300,
  routeCoordinates = [],
}) {
  const map = useRef(null);
  const { colors, isDark } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const validCenter = hasCoordinates(center) ? center : null;
  useEffect(() => {
    if (validCenter)
      map.current?.animateToRegion(
        { ...validCenter, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        350,
      );
  }, [validCenter?.latitude, validCenter?.longitude]);
  useEffect(() => {
    if (
      loaded &&
      routeCoordinates.length >= 2 &&
      routeCoordinates.every(hasCoordinates)
    )
      map.current?.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 40, bottom: 40, left: 40, right: 40 },
        animated: true,
      });
  }, [
    loaded,
    routeCoordinates,
    routeCoordinates[0]?.latitude,
    routeCoordinates[0]?.longitude,
    routeCoordinates[routeCoordinates.length - 1]?.latitude,
    routeCoordinates[routeCoordinates.length - 1]?.longitude,
  ]);
  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(timer);
  }, [loaded, attempt]);
  return (
    <View style={{ gap: 10 }}>
      <MapView
        key={attempt}
        ref={map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ height, width: '100%', borderRadius: 12 }}
        accessibilityLabel="Task map"
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        customMapStyle={
          isDark
            ? [
                { elementType: 'geometry', stylers: [{ color: '#16231C' }] },
                {
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#A1B2A7' }],
                },
                {
                  elementType: 'labels.text.stroke',
                  stylers: [{ color: '#16231C' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#374151' }],
                },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#0B1820' }],
                },
              ]
            : []
        }
        loadingEnabled
        loadingBackgroundColor={colors.surface}
        loadingIndicatorColor={colors.link}
        initialRegion={{
          ...(validCenter || DEFAULT_MAP_CENTER),
          latitudeDelta: validCenter ? 0.04 : 12,
          longitudeDelta: validCenter ? 0.04 : 12,
        }}
        onMapLoaded={() => {
          setLoaded(true);
          setTimedOut(false);
        }}
        onPress={(event) => onPick?.(event.nativeEvent.coordinate)}
      >
        {routeCoordinates.length >= 2 &&
        routeCoordinates.every(hasCoordinates) ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={FIXED_COLORS.mapDoerBlue}
            strokeWidth={4}
            geodesic
          />
        ) : null}
        {markers.filter(hasCoordinates).map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker}
            title={marker.title}
            pinColor={
              marker.isMe ? FIXED_COLORS.mapDoerBlue : FIXED_COLORS.brandGreen
            }
            onPress={(event) => {
              event.stopPropagation?.();
              onSelect?.(marker.id);
            }}
          />
        ))}
      </MapView>
      {timedOut ? (
        <>
          <ThemedText
            tone="warning"
            accessibilityRole="alert"
          >
            Map tiles have not loaded. Check your connection and try
            again.
          </ThemedText>
          <ThemedButton
            title="Retry map"
            variant="secondary"
            onPress={() => {
              setLoaded(false);
              setTimedOut(false);
              setAttempt((value) => value + 1);
            }}
          />
        </>
      ) : null}
    </View>
  );
}
