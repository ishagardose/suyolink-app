import { hasCoordinates } from './geo.js';

export async function getRoadRoute(from, to, signal) {
  if (!hasCoordinates(from) || !hasCoordinates(to))
    throw new Error('Valid doer and task locations are required.');
  const server = (
    process.env.EXPO_PUBLIC_ROUTING_URL || 'https://router.project-osrm.org'
  ).replace(/\/$/, '');
  const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const response = await fetch(
    `${server}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`,
    { signal },
  );
  if (!response.ok) throw new Error('Road route could not load. Try again.');
  const data = await response.json();
  const route = data.routes?.[0];
  if (
    data.code !== 'Ok' ||
    !route ||
    !Array.isArray(route.geometry?.coordinates)
  )
    throw new Error('No driving route was found between these locations.');
  const points = route.geometry.coordinates.map((point) => ({
    longitude: point[0],
    latitude: point[1],
  }));
  if (
    points.length < 2 ||
    !points.every(hasCoordinates) ||
    !Number.isFinite(route.distance) ||
    route.distance < 0 ||
    !Number.isFinite(route.duration) ||
    route.duration < 0
  )
    throw new Error('The routing service returned an invalid route.');
  return {
    points,
    distanceKm: route.distance / 1000,
    minutes: Math.max(1, Math.ceil(route.duration / 60)),
  };
}
