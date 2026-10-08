import * as Location from 'expo-location';

export default async function watchTaskLocation(onLocation, onError) {
  let active = true;
  let reading = false;
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
    },
    onLocation,
    onError,
  );
  // Request fresh fixes even when the doer is standing still.
  const heartbeat = setInterval(async () => {
    if (reading || !active) return;
    reading = true;
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (active) onLocation(position);
    } catch {
      if (active)
        onError('Waiting for a fresh GPS position. Check location services.');
    } finally {
      reading = false;
    }
  }, 15000);
  return {
    remove: () => {
      active = false;
      clearInterval(heartbeat);
      subscription.remove();
    },
  };
}
