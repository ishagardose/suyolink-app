export default async function watchTaskLocation(onLocation, onError) {
  if (!navigator.geolocation)
    throw new Error('Location is unavailable in this browser.');
  let active = true;
  let reading = false;
  const options = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 20000,
  };
  const receive = (position) => {
    reading = false;
    if (active)
      onLocation({ coords: position.coords, timestamp: position.timestamp });
  };
  const fail = (error) => {
    reading = false;
    if (active)
      onError(
        error.code === 1
          ? 'Location permission was denied. Allow it in your browser settings to share.'
          : 'Could not get a GPS update. Check location services and try again.',
      );
  };
  const id = navigator.geolocation.watchPosition(receive, fail, options);
  const heartbeat = setInterval(() => {
    if (!active || reading) return;
    reading = true;
    navigator.geolocation.getCurrentPosition(receive, fail, options);
  }, 15000);
  return {
    remove: () => {
      active = false;
      clearInterval(heartbeat);
      navigator.geolocation.clearWatch(id);
    },
  };
}
