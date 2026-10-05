export function hasCoordinates(point) {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

// Great-circle distance, not road distance or a travel-time estimate.
export function distanceKm(from, to) {
  if (!hasCoordinates(from) || !hasCoordinates(to)) return null;
  const rad = (value) => (value * Math.PI) / 180;
  const a =
    Math.sin(rad(to.latitude - from.latitude) / 2) ** 2 +
    Math.cos(rad(from.latitude)) *
      Math.cos(rad(to.latitude)) *
      Math.sin(rad(to.longitude - from.longitude) / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return 'Distance unavailable';
  return km < 0.1 ? 'Less than 0.1 km away' : `${km.toFixed(1)} km away`;
}

export const DEFAULT_MAP_CENTER = { latitude: 12.8797, longitude: 121.774 };
