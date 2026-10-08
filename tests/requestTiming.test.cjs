const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getRequestTiming } = require('../lib/requestTiming.js');
const now = Date.parse('2026-10-09T12:00:00Z');
test('posting age and overdue deadline are independent', () => {
  const timing = getRequestTiming(
    {
      createdAt: '2026-10-06T12:00:00Z',
      deadline: '2026-10-08T12:00:00Z',
      status: 'open',
    },
    now,
  );
  assert.equal(timing.postedTime, 'Posted 3 days ago');
  assert.equal(timing.overdue, true);
  assert.match(timing.due, /^Overdue:/);
  assert.equal(
    getRequestTiming(
      { createdAt: now - 60000, deadline: now + 1000, status: 'open' },
      now,
    ).postedTime,
    'Posted 1 minute ago',
  );
  assert.equal(
    getRequestTiming({ deadline: now, status: 'open' }, now).overdue,
    true,
  );
  for (const status of ['completed', 'cancelled', 'awaiting_confirmation'])
    assert.equal(
      getRequestTiming({ deadline: now - 1000, status }, now).overdue,
      false,
    );
});
test('unknown and invalid timestamps never claim just now or due today', () => {
  for (const createdAt of [null, undefined, '', 'bad-date']) {
    const timing = getRequestTiming({ createdAt, deadline: 'bad-date' }, now);
    assert.equal(timing.createdAt, null);
    assert.equal(timing.postedTime, 'Posting time unavailable');
    assert.equal(timing.due, 'No deadline set');
  }
  assert.equal(
    getRequestTiming({ createdAt: now - 30000 }, now).postedTime,
    'Posted just now',
  );
  assert.doesNotMatch(
    getRequestTiming({ createdAt: now + 30000 }, now).postedTime,
    /just now/,
  );
});
