import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { createRequest, readRequests } from '../data/suyoRequests';

export const REQUESTS_KEY = '@suyolink/requests-v1';
const SuyoContext = createContext(null);

export function SuyoProvider({ children }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const records = useRef([]);
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const loaded = readRequests(await AsyncStorage.getItem(REQUESTS_KEY));
      records.current = loaded;
      setRequests(loaded);
    } catch {
      setError(
        'Could not load saved requests. Please retry. Your saved data has not been changed.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);

  const postRequest = async (draft) => {
    if (isLoading || error)
      throw new Error(
        'Wait for your saved requests to load, or retry loading them.'
      );
    if (saving.current) throw new Error('A request is already being saved.');
    const request = createRequest(draft, user);
    saving.current = true;
    try {
      const next = [request, ...records.current];
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(next));
      records.current = next;
      setRequests(next);
      return request;
    } catch {
      throw new Error(
        'Could not save your request. Your form is still here; please try again.'
      );
    } finally {
      saving.current = false;
    }
  };
  return (
    <SuyoContext.Provider
      value={{ requests, isLoading, error, reload, postRequest }}
    >
      {children}
    </SuyoContext.Provider>
  );
}
export function useSuyos() {
  const value = useContext(SuyoContext);
  if (!value) throw new Error('useSuyos must be used inside SuyoProvider');
  return value;
}
