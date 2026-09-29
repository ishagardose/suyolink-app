import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { hasCoordinates } from '../lib/geo';

const LocationContext = createContext(null);
export const locationStorageKey = id => `@suyolink/location/${id}`;
export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ userId: null, ready: false, position: null, saved: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const busy = useRef(false);
  const accountId = useRef(user?.id);
  accountId.current = user?.id;
  useEffect(() => {
    const current = ++generation.current;
    busy.current = false; setLoading(false); setError('');
    setState({ userId: user?.id, ready: false, position: null, saved: false });
    if (!user?.id) return;
    AsyncStorage.getItem(locationStorageKey(user.id)).then(raw => {
      if (current !== generation.current) return;
      let saved;
      try { saved = JSON.parse(raw); } catch { saved = null; }
      const valid = hasCoordinates(saved?.position);
      setState({ userId: user.id, ready: true, position: valid ? saved.position : null, saved: valid });
      if (valid && saved.source === 'gps') locate();
    }).catch(() => {
      if (current === generation.current) {
        setState({ userId: user.id, ready: true, position: null, saved: false });
        setError('Could not restore your location. Please choose your area again.');
      }
    });
    return () => { generation.current++; };
  }, [user?.id]);

  const locate = async () => {
    if (busy.current || !user?.id) return null;
    const current = generation.current;
    const id = user.id;
    busy.current = true; setLoading(true); setError('');
    let timer;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (current !== generation.current || id !== accountId.current) return null;
      if (!permission.granted) throw new Error('Location permission is off. Choose your area on the map instead, or enable permission in settings.');
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Location took too long. Choose a point on the map or try again.')), 15000); }),
      ]);
      if (current !== generation.current || id !== accountId.current) return null;
      const next = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      if (!hasCoordinates(next)) throw new Error('Could not find a valid location. Choose a point on the map.');
      setState(previous => ({ ...previous, userId: id, position: next }));
      return next;
    } catch (err) {
      if (current === generation.current) setError(err.message || 'Could not get your location. Try again.');
      return null;
    } finally {
      clearTimeout(timer);
      if (current === generation.current) { busy.current = false; setLoading(false); }
    }
  };
  const saveLocation = async (point, source = 'manual') => {
    const id = user?.id;
    if (!id) throw new Error('Please sign in first.');
    if (!hasCoordinates(point)) throw new Error('Choose a location on the map first.');
    const next = { latitude: point.latitude, longitude: point.longitude };
    await AsyncStorage.setItem(locationStorageKey(id), JSON.stringify({ position: next, source }));
    if (id !== accountId.current) return false;
    // A GPS request started earlier must not overwrite a manually chosen area.
    generation.current++; busy.current = false; setLoading(false); setError('');
    setState({ userId: id, ready: true, position: next, saved: true });
    return true;
  };
  const owned = state.userId === user?.id;
  return <LocationContext.Provider value={{ position: owned ? state.position : null,
    isReady: owned && state.ready, hasSavedLocation: owned && state.saved, saveLocation, locate, loading, error }}>{children}</LocationContext.Provider>;
}
export const useDeviceLocation = () => useContext(LocationContext);
