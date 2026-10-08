import { Platform } from 'react-native';
import * as Location from 'expo-location';

export async function watchDevicePosition(onLocation, onError) {
  if (Platform.OS === 'web') {
    const id = navigator.geolocation.watchPosition(
      onLocation,
      (error) => onError(error.message || 'Could not update your location.'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    return { remove: () => navigator.geolocation.clearWatch(id) };
  }
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
    },
    onLocation,
    onError,
  );
}
