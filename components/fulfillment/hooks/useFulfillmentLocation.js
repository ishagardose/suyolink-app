import { useEffect, useState } from 'react';
import useTaskTracking from '../../../hooks/useTaskTracking';
import { distanceKm, formatDistance } from '../../../lib/geo';

// Both task screens read the persisted, consent-gated feed. Sharing is started
// explicitly on the map, where the same hook handles foreground GPS cleanup.
export default function useFulfillmentLocation({ task, user }) {
  const tracking = useTaskTracking(task.id, user?.id);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const request = tracking.task;
  const participant =
    request &&
    (request.requesterId === user?.id || request.providerId === user?.id);
  const latitude = request?.exactLatitude ?? request?.latitude;
  const longitude = request?.exactLongitude ?? request?.longitude;
  const dropoffLocation =
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
  const age = now - Date.parse(tracking.position?.updated_at);
  const liveDoerLocation =
    participant &&
    ['assigned', 'in_progress'].includes(request.status) &&
    tracking.consent &&
    !tracking.consent.revoked_at &&
    age >= 0 &&
    age < 30000
      ? tracking.position
      : null;
  const distance =
    liveDoerLocation && dropoffLocation
      ? distanceKm(liveDoerLocation, dropoffLocation)
      : null;
  return {
    request,
    dropoffLocation,
    liveDoerLocation,
    liveDistanceText:
      distance == null
        ? 'Waiting for shared location'
        : formatDistance(distance),
  };
}
