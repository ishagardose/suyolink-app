import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { DEFAULT_MAP_CENTER } from '../../lib/geo';

export default function TaskMap({
  center,
  markers = [],
  connection = [],
  onPick,
  onSelect,
  height = 300,
  fitMarkers = false,
}) {
  const map = useRef(null);
  const [ready, setReady] = useState(false);
  const markerCoordinates = markers
    .map((marker) => `${marker.latitude},${marker.longitude}`)
    .join(';');
  useEffect(() => {
    if (center)
      map.current?.animateToRegion(
        { ...center, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        350,
      );
  }, [center?.latitude, center?.longitude]);
  useEffect(() => {
    if (ready && fitMarkers && markers.length)
      map.current?.fitToCoordinates(markers, {
        edgePadding: { top: 45, right: 45, bottom: 45, left: 45 },
        animated: true,
      });
  }, [ready, fitMarkers, markerCoordinates]);
  return (
    <MapView
      ref={map}
      onMapReady={() => setReady(true)}
      style={{ height, width: '100%' }}
      accessibilityLabel="Task map"
      initialRegion={{
        ...(center || DEFAULT_MAP_CENTER),
        latitudeDelta: center ? 0.04 : 12,
        longitudeDelta: center ? 0.04 : 12,
      }}
      onPress={(event) => onPick?.(event.nativeEvent.coordinate)}
    >
      {connection.length > 1 ? (
        <>
          <Polyline
            coordinates={connection}
            strokeColor="#FFFFFF"
            strokeWidth={7}
          />
          <Polyline
            coordinates={connection}
            strokeColor="#2563EB"
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        </>
      ) : null}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker}
          title={marker.title}
          anchor={marker.kind === 'doer' ? { x: 0.5, y: 0.5 } : undefined}
          zIndex={marker.kind === 'doer' ? 1 : 0}
          pinColor={marker.isMe ? '#2563EB' : '#1E4D2B'}
          onPress={(event) => {
            event.stopPropagation?.();
            onSelect?.(marker.id);
          }}
        >
          {marker.kind === 'doer' ? (
            <View
              collapsable={false}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="person"
                size={24}
                color="#2563EB"
              />
            </View>
          ) : null}
        </Marker>
      ))}
    </MapView>
  );
}
