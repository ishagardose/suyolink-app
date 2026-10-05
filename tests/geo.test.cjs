const { test } = require('node:test');
const assert = require('node:assert/strict');
const { distanceKm, hasCoordinates, formatDistance } = require('../lib/geo.js');
test('kilometres handle known distances, date line and invalid coordinates', () => {
  assert.equal(
    distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }),
    0,
  );
  assert.ok(
    Math.abs(
      distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) -
        111.195,
    ) < 0.01,
  );
  assert.ok(
    distanceKm(
      { latitude: 0, longitude: 179.9 },
      { latitude: 0, longitude: -179.9 },
    ) < 23,
  );
  assert.equal(distanceKm(null, { latitude: 0, longitude: 0 }), null);
  for (const point of [
    { latitude: null, longitude: null },
    { latitude: NaN, longitude: 1 },
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 },
  ])
    assert.equal(hasCoordinates(point), false);
  assert.equal(formatDistance(0), 'Less than 0.1 km away');
  assert.equal(formatDistance(null), 'Distance unavailable');
});
