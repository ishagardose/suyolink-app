import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const KEY = '@suyolink/push-token';

// Expo Go on Android removed remote push notifications in SDK 53+.
// Importing expo-notifications in Expo Go triggers automatic push registration side-effects that log a Console Error.
let isExpoGo = false;
try {
  isExpoGo =
    isRunningInExpoGo?.() ||
    Constants?.appOwnership === 'expo' ||
    Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient ||
    Constants?.executionEnvironment === 'storeClient';
} catch {
  isExpoGo = false;
}

let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    Notifications = null;
  }
}

export async function registerPush() {
  if (isExpoGo) {
    throw new Error(
      'Push notifications require a development build. Expo Go SDK 53+ does not support remote push notifications.',
    );
  }
  if (!Notifications) {
    throw new Error('Notifications module is not available.');
  }
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;
  if (!projectId)
    throw new Error(
      'Push notifications are not configured for this build yet.',
    );
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Task updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Enable notifications in your device settings to receive task alerts.',
    );
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
  });
  if (error) throw error;
  await AsyncStorage.setItem(KEY, token);
}

export async function unregisterPush() {
  const token = await AsyncStorage.getItem(KEY);
  if (token) {
    const { error } = await supabase.rpc('remove_push_token', {
      p_token: token,
    });
    if (error) throw error;
    await AsyncStorage.removeItem(KEY);
  }
}

export function observePush(onOpen) {
  if (isExpoGo || !Notifications) {
    return () => {};
  }
  const open = (response) => {
    const id = response?.notification?.request?.content?.data?.requestId;
    if (typeof id === 'string') onOpen(id);
  };
  const last = Notifications.getLastNotificationResponse();
  if (last) {
    open(last);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }
  const subscription =
    Notifications.addNotificationResponseReceivedListener(open);
  return () => subscription.remove();
}
