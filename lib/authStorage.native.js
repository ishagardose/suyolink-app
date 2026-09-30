import * as SecureStore from 'expo-secure-store';
import { createStorageAdapter } from './storageAdapter';

const secureStoreBackend = {
  async getItem(key) {
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(key);
  },
};

export const authStorage = createStorageAdapter(secureStoreBackend);
