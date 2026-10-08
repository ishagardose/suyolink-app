const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizePhilippineMobileInput,
  formatPhilippineMobile,
} = require('../lib/phone.js');

test('local, national and international mobile inputs use the same stored number', () => {
  for (const value of [
    '09178421983',
    '9178421983',
    '+63 917 842 1983',
    '639178421983',
  ]) {
    assert.equal(normalizePhilippineMobileInput(value), '9178421983');
    assert.equal(formatPhilippineMobile(value), '+639178421983');
  }
});

test('incomplete or invalid mobile numbers cannot be formatted for submission', () => {
  for (const value of ['', '91784', '8178421983'])
    assert.throws(() => formatPhilippineMobile(value));
});
