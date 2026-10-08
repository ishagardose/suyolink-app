import { useEffect, useRef, useState } from 'react';
import { hasCoordinates } from '../lib/geo';
import { getRoadRoute } from '../lib/roadRoute';

export default function useRoadRoute(from, to) {
  const valid = hasCoordinates(from) && hasCoordinates(to);
  const destination = valid ? `${to.latitude},${to.longitude}` : '';
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const lastStarted = useRef(0);
  useEffect(() => {
    if (!valid) {
      setResult(null);
      setError('');
      setLoading(false);
      return;
    }
    let active = true;
    const controller = new AbortController();
    let timeout;
    setLoading(true);
    setError('');
    // Live GPS updates must not request a new route on every position sample.
    const timer = setTimeout(
      async () => {
        lastStarted.current = Date.now();
        timeout = setTimeout(() => controller.abort(), 12000);
        try {
          const route = await getRoadRoute(from, to, controller.signal);
          if (active) setResult({ destination, route });
        } catch (err) {
          if (active) {
            setResult(null);
            setError(
              err.name === 'AbortError'
                ? 'Road route timed out. Try again.'
                : err.message,
            );
          }
        } finally {
          clearTimeout(timeout);
          if (active) setLoading(false);
        }
      },
      Math.max(0, 30000 - (Date.now() - lastStarted.current)),
    );
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    valid,
    from?.latitude,
    from?.longitude,
    to?.latitude,
    to?.longitude,
    destination,
    retry,
  ]);
  return {
    route: valid && result?.destination === destination ? result.route : null,
    error,
    loading,
    retry: () => {
      lastStarted.current = Math.min(lastStarted.current, Date.now() - 29000);
      setRetry((value) => value + 1);
    },
  };
}
