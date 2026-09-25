import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { light, dark } from './colors';

const ThemeContext = createContext(null);
const STORAGE_KEY = '@suyolink/theme';
const MODES = ['light', 'dark', 'system'];

export function ThemeProvider({ children }) {
  const deviceScheme = useColorScheme();
  const [themeMode, setMode] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((mode) => { if (active && MODES.includes(mode)) setMode(mode); })
      .catch(() => {})
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => {
    const scheme = themeMode === 'system' ? (deviceScheme ?? 'light') : themeMode;
    return {
      themeMode, isLoading, isDark: scheme === 'dark',
      colors: scheme === 'dark' ? dark : light,
      setThemeMode: (mode) => {
        if (!MODES.includes(mode)) return Promise.reject(new Error('Invalid theme mode'));
        // Serialize writes so rapid changes persist the last selection.
        const write = writes.current.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEY, mode));
        writes.current = write;
        return write.then(() => setMode(mode));
      },
    };
  }, [themeMode, deviceScheme, isLoading]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
