const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequest, readRequests, parseDeadline } = require('../data/suyoRequests.js');
const user = { email: 'demo@example.com', name: 'Demo User' };
const draft = { title: ' Groceries ', details: 'Rice and eggs', category: 'Groceries',
  offerAmount: '150.25', deadline: '2099-12-31 18:30', location: 'Davao', notes: '' };
test('new requests store money exactly, ownership and open status', () => {
  const result = createRequest(draft, user);
  assert.equal(result.title, 'Groceries');
  assert.equal(result.offerCentavos, 15025);
  assert.equal(result.requesterEmail, user.email);
  assert.equal(result.status, 'open');
  assert.equal(result.providerEmail, null);
  assert.deepEqual(result.applicants, []);
  assert.deepEqual(readRequests(JSON.stringify([result])), [result]);
});
test('required fields, category, amounts and deadlines reject invalid input', () => {
  for (const change of [{ title: ' ' }, { details: ' ' }, { location: ' ' }, { category: 'Unknown' },
    { offerAmount: '0' }, { offerAmount: '-5' }, { offerAmount: '1.001' }, { offerAmount: 'Infinity' },
    { offerAmount: '1000001' }, { deadline: '2000-01-01 12:00' }, { deadline: '2099-02-30 12:00' }]) {
    assert.throws(() => createRequest({ ...draft, ...change }, user));
  }
  assert.throws(() => createRequest(draft, null));
});
test('deadline uses local time and validates calendar dates', () => {
  const date = parseDeadline('2099-12-31 18:30');
  assert.equal(date.getHours(), 18);
  assert.equal(date.getMinutes(), 30);
  assert.throws(() => parseDeadline('2099-13-01 12:00'));
  assert.throws(() => parseDeadline('2099-12-31 24:00'));
});
test('bad storage is rejected instead of silently overwritten', () => {
  assert.deepEqual(readRequests(null), []);
  for (const raw of ['bad json', '{}', '[null]', '[{}]']) assert.throws(() => readRequests(raw));
});
