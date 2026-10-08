import { useState, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../../lib/supabase';
import { distanceKm, formatDistance } from '../../../lib/geo';

export default function useFulfillmentLocation({ channelRef, task, user }) {
  const [liveDistanceText, setLiveDistanceText] = useState(task.distanceText);

  const [liveDoerLocation, setLiveDoerLocation] = useState(() => ({
    latitude: task.latitude - 0.0053,
    longitude: task.longitude + 0.0043,
  }));

  const dropoffLocation = useMemo(
    () => ({ latitude: task.latitude, longitude: task.longitude }),
    [task.latitude, task.longitude],
  );

  useEffect(() => {
    let sub = null;
    let webWatchId = null;
    let isMounted = true;

    async function initGPS() {
      // 1. Web browser environment: use standard W3C navigator.geolocation
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (isMounted && pos?.coords) {
                const coords = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setLiveDoerLocation(coords);
                const d = distanceKm(coords, dropoffLocation);
                if (d !== null) {
                  const formatted = formatDistance(d);
                  setLiveDistanceText(formatted);
                  broadcastLocation(coords, formatted);
                }
              }
            },
            () => {},
          );

          try {
            webWatchId = navigator.geolocation.watchPosition(
              (pos) => {
                if (isMounted && pos?.coords) {
                  const coords = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  };
                  setLiveDoerLocation(coords);
                  const d = distanceKm(coords, dropoffLocation);
                  if (d !== null) {
                    const formatted = formatDistance(d);
                    setLiveDistanceText(formatted);
                    broadcastLocation(coords, formatted);
                  }
                }
              },
              () => {},
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
            );
          } catch (_) {}
        }
        return;
      }

      // 2. Native Mobile environment (iOS / Android)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted && current?.coords) {
          const coords = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          };
          setLiveDoerLocation(coords);

          const d = distanceKm(coords, dropoffLocation);
          if (d !== null) {
            const formatted = formatDistance(d);
            setLiveDistanceText(formatted);
            broadcastLocation(coords, formatted);
          }
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (loc) => {
            if (isMounted && loc?.coords) {
              const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              };
              setLiveDoerLocation(coords);
              const d = distanceKm(coords, dropoffLocation);
              if (d !== null) {
                const formatted = formatDistance(d);
                setLiveDistanceText(formatted);
                broadcastLocation(coords, formatted);
              }
            }
          },
        );
      } catch (err) {
        console.warn('Native GPS watch error:', err);
      }
    }

    initGPS();

    return () => {
      isMounted = false;
      if (
        webWatchId !== null &&
        typeof navigator !== 'undefined' &&
        navigator.geolocation
      ) {
        try {
          navigator.geolocation.clearWatch(webWatchId);
        } catch (_) {}
      }
      if (sub && typeof sub.remove === 'function') {
        try {
          sub.remove();
        } catch (_) {}
      }
    };
  }, [dropoffLocation]);

  const broadcastLocation = async (coords, distText) => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            distanceText: distText,
            taskId: task.id,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.warn('Realtime location broadcast error:', e);
      }
    }

    // Persist to Supabase if logged in
    if (supabase && user?.id && task.id) {
      try {
        await supabase.rpc('update_task_location', {
          p_request_id: task.id,
          p_latitude: coords.latitude,
          p_longitude: coords.longitude,
        });
      } catch (_) {}
    }
  };
  return {
    dropoffLocation,
    liveDistanceText,
    liveDoerLocation,
    setLiveDistanceText,
    setLiveDoerLocation,
  };
}
