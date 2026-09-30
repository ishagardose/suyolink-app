const { test } = require('node:test');
const assert = require('node:assert/strict');
const { urgencyFor } = require('../lib/urgency.js');

test('urgencyFor correctly categorizes deadlines', () => {
  const baseTime = new Date('2026-09-30T12:00:00.000Z').getTime();

  // Exactly 3 hours: urgent
  const exact3h = new Date(baseTime + 3 * 60 * 60 * 1000).toISOString();
  const res3h = urgencyFor(exact3h, baseTime);
  assert.equal(res3h?.key, 'urgent');
  assert.equal(res3h?.label, 'Urgent');

  // Within 3 hours (e.g. 2 hours): urgent
  const within3h = new Date(baseTime + 2 * 60 * 60 * 1000).toISOString();
  const resWithin3h = urgencyFor(within3h, baseTime);
  assert.equal(resWithin3h?.key, 'urgent');

  // Immediately after 3 hours (3 hours + 1 ms): due_soon
  const after3h = new Date(baseTime + 3 * 60 * 60 * 1000 + 1).toISOString();
  const resAfter3h = urgencyFor(after3h, baseTime);
  assert.equal(resAfter3h?.key, 'due_soon');
  assert.equal(resAfter3h?.label, 'Due soon');

  // Exactly 24 hours: due_soon
  const exact24h = new Date(baseTime + 24 * 60 * 60 * 1000).toISOString();
  const res24h = urgencyFor(exact24h, baseTime);
  assert.equal(res24h?.key, 'due_soon');

  // Immediately after 24 hours: null (no urgency tag)
  const after24h = new Date(baseTime + 24 * 60 * 60 * 1000 + 1000).toISOString();
  const resAfter24h = urgencyFor(after24h, baseTime);
  assert.equal(resAfter24h, null);

  // Expired: null or handled gracefully
  const expired = new Date(baseTime - 1000).toISOString();
  assert.equal(urgencyFor(expired, baseTime), null);

  // Invalid date: null
  assert.equal(urgencyFor('invalid-date', baseTime), null);
  assert.equal(urgencyFor(null, baseTime), null);
});
