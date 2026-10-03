import { createStorageAdapter } from './storageAdapter';

const webStorageBackend = {
  async getItem(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key, value) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

export const authStorage = createStorageAdapter(webStorageBackend);
