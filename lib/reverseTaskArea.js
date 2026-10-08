import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Expo SDK 54 reverse geocoding is native-only. A manually chosen pin must
// remain usable even when location permission or address lookup is unavailable.
export async function reverseTaskArea(coordinates) {
  if (Platform.OS === 'web') return '';
  if (Platform.OS === 'android') {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return '';
  }
  const [address] = await Location.reverseGeocodeAsync(coordinates);
  if (!address) return '';
  // Never expose house numbers, streets, placemark names or full addresses.
  return [
    ...new Set(
      [address.district, address.city, address.region].filter(Boolean),
    ),
  ]
    .join(', ')
    .slice(0, 250);
}
