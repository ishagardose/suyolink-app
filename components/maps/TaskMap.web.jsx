import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_MAP_CENTER } from '../../lib/geo';
import { FIXED_COLORS } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export default function TaskMap({
  center,
  markers = [],
  onPick,
  onSelect,
  height = 300,
}) {
  const { colors } = useTheme();
  const element = useRef(null);
  const instance = useRef(null);
  const layer = useRef(null);
  const handlers = useRef({ onPick, onSelect });
  handlers.current = { onPick, onSelect };
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const L = require('leaflet');
    const initial = center || DEFAULT_MAP_CENTER;
    const map = L.map(element.current, { scrollWheelZoom: false }).setView(
      [initial.latitude, initial.longitude],
      center ? 14 : 5,
    );
    instance.current = map;
    layer.current = L.layerGroup().addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on('tileerror', () => setTileError(true))
      .addTo(map);
    map.on('click', (event) =>
      handlers.current.onPick?.({
        latitude: event.latlng.lat,
        longitude: event.latlng.wrap().lng,
      }),
    );
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(element.current);
    setReady(true);
    return () => {
      resize.disconnect();
      map.remove();
      instance.current = null;
    };
  }, []);
  useEffect(() => {
    if (ready && center)
      instance.current.setView([center.latitude, center.longitude], 14);
  }, [ready, center?.latitude, center?.longitude]);
  useEffect(() => {
    if (!ready) return;
    const L = require('leaflet');
    layer.current.clearLayers();
    markers.forEach((marker) => {
      const label = document.createElement('span');
      label.textContent = marker.title;
      L.circleMarker([marker.latitude, marker.longitude], {
        radius: marker.isMe ? 8 : 11,
        color: FIXED_COLORS.white,
        weight: 2,
        fillColor: marker.isMe
          ? FIXED_COLORS.mapDoerBlue
          : FIXED_COLORS.brandGreen,
        fillOpacity: 1,
      })
        .bindTooltip(label)
        .on('click', (event) => {
          L.DomEvent.stopPropagation(event.originalEvent);
          handlers.current.onSelect?.(marker.id);
        })
        .addTo(layer.current);
    });
  }, [ready, markers]);
  return (
    <div style={{ width: '100%' }}>
      <div
        ref={element}
        data-testid="task-map"
        aria-label="Task map"
        style={{ height, width: '100%', borderRadius: 12, zIndex: 0 }}
      />
      {tileError ? (
        <p
          role="status"
          style={{ color: colors.warning, fontSize: 12 }}
        >
          Map tiles could not load. Check your connection; saved pins and
          distances are still available.
        </p>
      ) : null}
    </div>
  );
}
