import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeUser, readStoredUser } from './mockSession';

const AuthContext = createContext(null);
export const SESSION_KEY = '@suyolink/mock-user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SESSION_KEY)
      .then((stored) => { if (active) setUser(readStoredUser(stored)); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user, isLoggedIn: user !== null, isLoading,
    // Local demo only: no credential verification and no passwords stored.
    login: async (profile) => {
      const nextUser = normalizeUser(profile);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    },
    logout: async () => {
      await AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
    },
    updateProfile: async (profile) => {
      if (!user) throw new Error('Please log in first.');
      const nextUser = normalizeUser({ ...user, ...profile });
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    },
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
