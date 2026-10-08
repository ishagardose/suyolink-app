import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { getRequestDetails } from '../data/suyoApi';
import { watchDevicePosition } from '../lib/watchDevicePosition';

export default function useTaskTracking(requestId, userId) {
  const [task, setTask] = useState(null);
  const [position, setPosition] = useState(null);
  const [consent, setConsent] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [busy, setBusy] = useState(false);
  const watcher = useRef(null);
  const generation = useRef(0);
  const sharingRef = useRef(false);
  const mounted = useRef(false);
  const operation = useRef(false);
  const identity = useRef(null);
  identity.current = `${requestId}:${userId}`;
  const refresh = useCallback(async () => {
    if (!requestId || !supabase) return;
    const current = generation.current;
    try {
      const next = await getRequestDetails(requestId);
      if (!next) throw new Error('Task unavailable.');
      if (!mounted.current || current !== generation.current) return;
      setTask(next);
      // Public viewers can see the approximate task map, never tracking data.
      let point = null,
        permission = null;
      if (next.requesterId === userId || next.providerId === userId) {
        const [loc, con] = await Promise.all([
          supabase
            .from('live_locations')
            .select('*')
            .eq('request_id', requestId)
            .maybeSingle(),
          supabase
            .from('tracking_consents')
            .select('*')
            .eq('request_id', requestId)
            .maybeSingle(),
        ]);
        if (loc.error || con.error) throw loc.error || con.error;
        point = loc.data;
        permission = con.data;
      }
      if (!mounted.current || current !== generation.current) return;
      setTask(next);
      setPosition(point);
      setConsent(permission);
      setReadError('');
      if (
        !['assigned', 'in_progress'].includes(next.status) ||
        permission?.revoked_at
      ) {
        watcher.current?.remove();
        watcher.current = null;
        sharingRef.current = false;
        setSharing(false);
      }
    } catch (e) {
      if (mounted.current && current === generation.current)
        setReadError(e.message);
    }
  }, [requestId, userId]);
  const stop = useCallback(async () => {
    ++generation.current;
    watcher.current?.remove();
    watcher.current = null;
    sharingRef.current = false;
    if (mounted.current) {
      setSharing(false);
      setPosition(null);
    }
    const result = await supabase.rpc('set_tracking_consent', {
      p_request_id: requestId,
      p_share: false,
    });
    if (result.error && mounted.current) setError(result.error.message);
    await refresh();
  }, [requestId, refresh]);
  useEffect(() => {
    mounted.current = true;
    setTask(null);
    setPosition(null);
    setConsent(null);
    setError('');
    setReadError('');
    if (!requestId || !userId || !supabase) {
      return () => {
        mounted.current = false;
        ++generation.current;
      };
    }
    refresh();
    const timer = setInterval(refresh, 6000);
    const channel = supabase
      ?.channel(`tracking-${requestId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations',
          filter: `request_id=eq.${requestId}`,
        },
        refresh,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracking_consents',
          filter: `request_id=eq.${requestId}`,
        },
        refresh,
      )
      .subscribe();
    const appState = AppState.addEventListener('change', (state) => {
      if (
        state === 'background' ||
        (state === 'inactive' && sharingRef.current)
      ) {
        ++generation.current;
        if (sharingRef.current) stop();
      }
    });
    return () => {
      mounted.current = false;
      ++generation.current;
      clearInterval(timer);
      appState.remove();
      watcher.current?.remove();
      watcher.current = null;
      if (sharingRef.current)
        supabase
          .rpc('set_tracking_consent', {
            p_request_id: requestId,
            p_share: false,
          })
          .then(() => {});
      sharingRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [requestId, userId, refresh, stop]);
  const start = async () => {
    if (operation.current || sharingRef.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    let current = generation.current;
    const startedFor = identity.current;
    let locationTimer;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          'Allow location access in settings to share your position.',
        );
      if (!mounted.current || startedFor !== identity.current) return;
      // Android permission/provider dialogs can briefly background the app.
      // Continue on return rather than silently cancelling the button press.
      if (AppState.currentState === 'background')
        throw new Error('Return to the app and tap Share location again.');
      current = generation.current;
      if (!(await Location.hasServicesEnabledAsync()))
        throw new Error('Turn on your device location services and try again.');
      const initialLocation = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise((_, reject) => {
          locationTimer = setTimeout(
            () =>
              reject(
                new Error(
                  'Could not get a GPS position. Move near a window or outdoors and try again.',
                ),
              ),
            15000,
          );
        }),
      ]);
      clearTimeout(locationTimer);
      if (!mounted.current || current !== generation.current) return;
      const result = await supabase.rpc('set_tracking_consent', {
        p_request_id: requestId,
        p_share: true,
      });
      if (result.error) throw result.error;
      if (!mounted.current || current !== generation.current) {
        await supabase.rpc('set_tracking_consent', {
          p_request_id: requestId,
          p_share: false,
        });
        return;
      }
      current = ++generation.current;
      sharingRef.current = true;
      let uploading = false,
        lastSent = 0;
      const uploadLocation = async (location, requireSuccess = false) => {
        if (
          uploading ||
          Date.now() - lastSent < 4000 ||
          !sharingRef.current ||
          current !== generation.current
        )
          return;
        uploading = true;
        lastSent = Date.now();
        try {
          const c = location.coords;
          const update = await supabase.rpc('update_task_location', {
            p_request_id: requestId,
            p_latitude: c.latitude,
            p_longitude: c.longitude,
            p_accuracy: c.accuracy >= 0 ? c.accuracy : null,
            p_speed: c.speed >= 0 ? c.speed : null,
          });
          if (update.error) throw update.error;
          if (mounted.current && current === generation.current) {
            setPosition(update.data);
            setError('');
          }
        } catch (e) {
          if (mounted.current && current === generation.current)
            setError(e.message);
          if (requireSuccess) throw e;
        } finally {
          uploading = false;
        }
      };
      await uploadLocation(initialLocation, true);
      const subscription = await watchDevicePosition(
        uploadLocation,
        (message) => {
          if (mounted.current) setError(message);
        },
      );
      if (!mounted.current || current !== generation.current) {
        subscription.remove();
        return;
      }
      watcher.current = subscription;
      setSharing(true);
      await refresh();
    } catch (e) {
      if (mounted.current) setError(e.message);
      if (sharingRef.current) await stop();
    } finally {
      clearTimeout(locationTimer);
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return {
    task,
    position,
    consent,
    sharing,
    error: error || readError,
    busy,
    start,
    stop,
    refresh,
  };
}
