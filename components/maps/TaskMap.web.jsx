import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_MAP_CENTER } from '../../lib/geo';
import { taskMarkerIcon } from './mapMarkerIcons.web';

export default function TaskMap({
  center,
  markers = [],
  connection = [],
  onPick,
  onSelect,
  height = 300,
  fitMarkers = false,
}) {
  const element = useRef(null);
  const instance = useRef(null);
  const layer = useRef(null);
  const handlers = useRef({ onPick, onSelect });
  handlers.current = { onPick, onSelect };
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const markerCoordinates = markers
    .map((marker) => `${marker.latitude},${marker.longitude}`)
    .join(';');
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
    if (connection.length > 1) {
      const coordinates = connection.map((point) => [
        point.latitude,
        point.longitude,
      ]);
      L.polyline(coordinates, {
        color: '#FFFFFF',
        weight: 7,
        opacity: 1,
        interactive: false,
      }).addTo(layer.current);
      L.polyline(coordinates, {
        color: '#2563EB',
        weight: 4,
        opacity: 1,
        dashArray: '8 6',
        interactive: false,
        className: 'suyo-map-connection',
      }).addTo(layer.current);
    }
    markers.forEach((marker) => {
      const label = document.createElement('span');
      label.textContent = marker.title;
      const coordinates = [marker.latitude, marker.longitude];
      const icon = taskMarkerIcon(L, marker.kind);
      const pin = icon
        ? L.marker(coordinates, { icon, title: marker.title })
        : L.circleMarker(coordinates, {
            radius: marker.isMe ? 8 : 11,
            color: '#FFFFFF',
            weight: 2,
            fillColor: marker.isMe ? '#2563EB' : '#1E4D2B',
            fillOpacity: 1,
          });
      pin
        .bindTooltip(label)
        .on('click', (event) => {
          L.DomEvent.stopPropagation(event.originalEvent);
          handlers.current.onSelect?.(marker.id);
        })
        .addTo(layer.current);
    });
  }, [ready, markers, connection]);
  useEffect(() => {
    if (!ready || !fitMarkers || !markers.length) return;
    const L = require('leaflet');
    instance.current.fitBounds(
      L.latLngBounds(
        markers.map((marker) => [marker.latitude, marker.longitude]),
      ),
      {
        padding: [35, 35],
        maxZoom: 16,
        animate: true,
      },
    );
  }, [ready, fitMarkers, markerCoordinates]);
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
          style={{ color: '#B45309', fontSize: 12 }}
        >
          Map tiles could not load. Check your connection; saved pins and
          distances are still available.
        </p>
      ) : null}
    </div>
  );
}
