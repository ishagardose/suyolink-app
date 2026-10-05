import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
const KEY = '@suyolink/push-token';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export async function registerPush() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
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
