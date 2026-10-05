import React, { useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { DEFAULT_MAP_CENTER } from '../../lib/geo';

export default function TaskMap({
  center,
  markers = [],
  onPick,
  onSelect,
  height = 300,
}) {
  const map = useRef(null);
  useEffect(() => {
    if (center)
      map.current?.animateToRegion(
        { ...center, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        350,
      );
  }, [center?.latitude, center?.longitude]);
  return (
    <MapView
      ref={map}
      style={{ height, width: '100%' }}
      accessibilityLabel="Task map"
      initialRegion={{
        ...(center || DEFAULT_MAP_CENTER),
        latitudeDelta: center ? 0.04 : 12,
        longitudeDelta: center ? 0.04 : 12,
      }}
      onPress={(event) => onPick?.(event.nativeEvent.coordinate)}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker}
          title={marker.title}
          pinColor={marker.isMe ? '#2563EB' : '#1E4D2B'}
          onPress={(event) => {
            event.stopPropagation?.();
            onSelect?.(marker.id);
          }}
        />
      ))}
    </MapView>
  );
}
