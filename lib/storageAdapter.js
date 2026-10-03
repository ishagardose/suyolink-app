/**
 * Generic promise-based storage adapter.
 * Ensures consistent async behavior across platforms.
 *
 * @param {object} backend - Storage backend implementing getItem, setItem, removeItem
 * @returns {{ getItem: (key: string) => Promise<string|null>, setItem: (key: string, value: string) => Promise<void>, removeItem: (key: string) => Promise<void> }}
 */
export function createStorageAdapter(backend) {
  if (!backend) {
    throw new Error('Storage backend is required.');
  }

  return {
    async getItem(key) {
      const val = await backend.getItem(key);
      return val ?? null;
    },
    async setItem(key, value) {
      await backend.setItem(key, String(value));
    },
    async removeItem(key) {
      await backend.removeItem(key);
    },
  };
}
