import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);
export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    generation.current++;
    busy.current = false;
    setPosition(null);
    setError('');
    setLoading(false);
    if (user?.id) locate();
    return () => { generation.current++; };
  }, [user?.id]);

  const locate = async () => {
    if (busy.current) return null;
    const current = generation.current;
    busy.current = true;
    setLoading(true);
    setError('');
    let timer;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (current !== generation.current) return null;
      if (!permission.granted) throw new Error('Location permission is off. You can still place a task pin manually. Enable permission in settings to see distances.');
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Location took too long. Move outdoors or try again.')), 15000); }),
      ]);
      if (current !== generation.current) return null;
      const next = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      setPosition(next);
      return next;
    } catch (err) {
      if (current === generation.current) setError(err.message || 'Could not get your location. Try again.');
      return null;
    } finally {
      clearTimeout(timer);
      if (current === generation.current) { busy.current = false; setLoading(false); }
    }
  };
  return <LocationContext.Provider value={{ position, locate, loading, error }}>{children}</LocationContext.Provider>;
}
export const useDeviceLocation = () => useContext(LocationContext);
