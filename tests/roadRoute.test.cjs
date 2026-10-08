const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getRoadRoute } = require('../lib/roadRoute.js');
const from = { latitude: 7.075, longitude: 125.605 };
const to = { latitude: 7.07, longitude: 125.6 };

test('OSRM coordinate ordering and road geometry, distance, and duration are preserved', async (t) => {
  let url;
  t.mock.method(global, 'fetch', async (input) => {
    url = input;
    return {
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            distance: 1400,
            duration: 361,
            geometry: {
              coordinates: [
                [125.605, 7.075],
                [125.6, 7.075],
                [125.6, 7.07],
              ],
            },
          },
        ],
      }),
    };
  });
  const route = await getRoadRoute(from, to);
  assert.match(
    url,
    /125\.605,7\.075;125\.6,7\.07\?overview=full&geometries=geojson/,
  );
  assert.deepEqual(route.points, [
    from,
    { latitude: 7.075, longitude: 125.6 },
    to,
  ]);
  assert.equal(route.distanceKm, 1.4);
  assert.equal(route.minutes, 7);
});
test('no route and invalid route responses cannot become map lines', async (t) => {
  let data = { code: 'NoRoute', routes: [] };
  t.mock.method(global, 'fetch', async () => ({
    ok: true,
    json: async () => data,
  }));
  await assert.rejects(getRoadRoute(from, to), /No driving route/);
  data = {
    code: 'Ok',
    routes: [
      {
        distance: 1000,
        duration: 60,
        geometry: {
          coordinates: [
            [125, 999],
            [125, 7],
          ],
        },
      },
    ],
  };
  await assert.rejects(getRoadRoute(from, to), /invalid route/);
  await assert.rejects(getRoadRoute(null, to), /Valid doer/);
});
test('HTTP errors expose retryable failure without a fabricated route', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ ok: false }));
  await assert.rejects(getRoadRoute(from, to), /could not load/);
});
