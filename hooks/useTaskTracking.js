import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { getRequestDetails } from '../data/suyoApi';
import watchTaskLocation from '../lib/watchTaskLocation';

export default function useTaskTracking(requestId, userId) {
  const [task, setTask] = useState(null);
  const [position, setPosition] = useState(null);
  const [consent, setConsent] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const watcher = useRef(null);
  const generation = useRef(0);
  const sharingRef = useRef(false);
  const mounted = useRef(false);
  const operation = useRef(false);
  const refreshSequence = useRef(0);
  const refresh = useCallback(async () => {
    if (!requestId || !supabase) {
      setLoading(false);
      if (!supabase)
        setError('Live tracking is unavailable. Please try again later.');
      return;
    }
    const current = generation.current;
    const run = ++refreshSequence.current;
    try {
      const next = await getRequestDetails(requestId);
      if (!next) throw new Error('Task unavailable.');
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
      if (
        !mounted.current ||
        current !== generation.current ||
        run !== refreshSequence.current
      )
        return;
      setTask(next);
      setPosition(point);
      setConsent(permission);
      setError('');
      if (
        !['assigned', 'in_progress'].includes(next.status) ||
        (permission?.revoked_at && !operation.current)
      ) {
        if (sharingRef.current) ++generation.current;
        watcher.current?.remove();
        watcher.current = null;
        sharingRef.current = false;
        setSharing(false);
      }
    } catch (e) {
      if (
        mounted.current &&
        current === generation.current &&
        run === refreshSequence.current
      )
        setError(e.message);
    } finally {
      if (mounted.current && run === refreshSequence.current) setLoading(false);
    }
  }, [requestId, userId]);
  const stop = useCallback(async () => {
    const current = ++generation.current;
    watcher.current?.remove();
    watcher.current = null;
    sharingRef.current = false;
    if (mounted.current) {
      setSharing(false);
      setPosition(null);
      setBusy(true);
    }
    if (!requestId || !supabase) return;
    try {
      const result = await supabase.rpc('set_tracking_consent', {
        p_request_id: requestId,
        p_share: false,
      });
      if (result.error) throw result.error;
      if (mounted.current && current === generation.current) await refresh();
    } catch (e) {
      if (mounted.current && current === generation.current)
        setError(
          `Sharing stopped on this device. Could not confirm with the server: ${e.message}`,
        );
    } finally {
      if (mounted.current && current === generation.current) setBusy(false);
    }
  }, [requestId, refresh]);
  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      setTask(null);
      setPosition(null);
      setConsent(null);
      setSharing(false);
      setError('');
      setLoading(true);
      setBusy(false);
      refresh();
      const timer = setInterval(refresh, 6000);
      const channel = supabase
        ?.channel(`tracking-${requestId}-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'suyo_requests',
            filter: `id=eq.${requestId}`,
          },
          refresh,
        )
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
      const onVisibility = () => {
        if (document.hidden) {
          ++generation.current;
          if (sharingRef.current) stop();
        } else refresh();
      };
      if (typeof document !== 'undefined')
        document.addEventListener('visibilitychange', onVisibility);
      return () => {
        mounted.current = false;
        ++generation.current;
        clearInterval(timer);
        appState.remove();
        if (typeof document !== 'undefined')
          document.removeEventListener('visibilitychange', onVisibility);
        watcher.current?.remove();
        watcher.current = null;
        if (sharingRef.current)
          supabase
            .rpc('set_tracking_consent', {
              p_request_id: requestId,
              p_share: false,
            })
            .then(() => {})
            .catch(() => {});
        sharingRef.current = false;
        if (channel) supabase.removeChannel(channel);
      };
    }, [requestId, userId, refresh, stop]),
  );
  const start = async () => {
    if (operation.current || sharingRef.current || !supabase) return;
    if (
      task?.providerId !== userId ||
      !['assigned', 'in_progress'].includes(task?.status)
    ) {
      setError(
        'Only the accepted doer can share location during an active task.',
      );
      return;
    }
    operation.current = true;
    setBusy(true);
    setError('');
    const current = ++generation.current;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          'Allow location access in settings to share your position.',
        );
      if (!(await Location.hasServicesEnabledAsync()))
        throw new Error('Turn on location services to share your position.');
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
      sharingRef.current = true;
      let uploading = false,
        lastSent = 0;
      const subscription = await watchTaskLocation(
        async (location) => {
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
            if (location.timestamp && Date.now() - location.timestamp > 30000)
              throw new Error('Waiting for a fresh GPS position.');
            if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude))
              throw new Error('Waiting for a valid GPS position.');
            const update = await supabase.rpc('update_task_location', {
              p_request_id: requestId,
              p_latitude: c.latitude,
              p_longitude: c.longitude,
              p_accuracy:
                Number.isFinite(c.accuracy) && c.accuracy >= 0
                  ? c.accuracy
                  : null,
              p_speed:
                Number.isFinite(c.speed) && c.speed >= 0 ? c.speed : null,
            });
            if (update.error) throw update.error;
            if (mounted.current && current === generation.current) {
              setPosition(update.data);
              setError('');
            }
          } catch (e) {
            if (mounted.current && current === generation.current)
              setError(e.message);
          } finally {
            uploading = false;
          }
        },
        (message) => {
          if (mounted.current && current === generation.current)
            setError(message);
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
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return {
    task,
    position,
    consent,
    sharing,
    error,
    busy,
    loading,
    start,
    stop,
    refresh,
  };
}
