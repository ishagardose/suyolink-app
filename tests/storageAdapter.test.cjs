const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStorageAdapter } = require('../lib/storageAdapter.js');

test('storage adapter handles get, set, remove, and error propagation', async () => {
  const store = new Map();
  const mockBackend = {
    getItem: async (k) => store.get(k) ?? null,
    setItem: async (k, v) => {
      store.set(k, String(v));
    },
    removeItem: async (k) => {
      store.delete(k);
    },
  };

  const adapter = createStorageAdapter(mockBackend);

  // Missing key returns null
  assert.equal(await adapter.getItem('missing'), null);

  // Set item and get item
  await adapter.setItem('test-key', 'test-value');
  assert.equal(await adapter.getItem('test-key'), 'test-value');

  // Remove item
  await adapter.removeItem('test-key');
  assert.equal(await adapter.getItem('test-key'), null);

  // Error propagation
  const failingBackend = {
    getItem: async () => {
      throw new Error('Storage read failed');
    },
    setItem: async () => {
      throw new Error('Storage write failed');
    },
    removeItem: async () => {
      throw new Error('Storage remove failed');
    },
  };
  const failingAdapter = createStorageAdapter(failingBackend);
  await assert.rejects(
    () => failingAdapter.getItem('k'),
    /Storage read failed/,
  );
  await assert.rejects(
    () => failingAdapter.setItem('k', 'v'),
    /Storage write failed/,
  );
  await assert.rejects(
    () => failingAdapter.removeItem('k'),
    /Storage remove failed/,
  );
});
