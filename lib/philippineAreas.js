// PSGC Cloud is a third-party directory of Philippine geographic names.
// Only geographic codes are sent; task pins and private addresses stay local.
const BASE_URL = 'https://psgc.cloud/api/v2';
const cache = new Map();

export async function loadPhilippineAreas(path) {
  if (cache.has(path)) return cache.get(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${BASE_URL}/${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Area directory unavailable.');
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data;
    if (
      !Array.isArray(items) ||
      items.some((item) => !item.code || !item.name)
    ) {
      throw new Error('Area directory returned an invalid response.');
    }
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    cache.set(path, sorted);
    return sorted;
  } finally {
    clearTimeout(timeout);
  }
}

export function formatPublicArea({ region, city, barangay }) {
  const province =
    typeof city?.province === 'string' ? city.province : city?.province?.name;
  return [
    ...new Set(
      [barangay?.name, city?.name, province || region?.name].filter(Boolean),
    ),
  ]
    .join(', ')
    .slice(0, 250);
}

export function privatePinAddress(coordinates) {
  return `Selected map pin: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
}
