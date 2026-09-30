import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
let configError = '';
if (!url || !key) {
  configError = 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart Expo.';
} else {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
  } catch {
    configError = 'EXPO_PUBLIC_SUPABASE_URL must be a valid http or https URL. Update .env, then restart Expo.';
  }
}

export const authConfigError = configError;
// Recovery credentials stay in memory and never replace the app's signed-in account.
export function createRecoveryClient() {
  if (authConfigError) throw new Error(authConfigError);
  return createClient(url, key, { auth: {
    storageKey: 'suyolink-password-recovery', persistSession: false,
    autoRefreshToken: false, detectSessionInUrl: false,
  } });
}
// Auth actions belong in AuthContext, triggered by the forms, never at import time.
export const supabase = authConfigError ? null : createClient(url, key, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
