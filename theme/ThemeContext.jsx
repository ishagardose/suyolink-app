import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { light, dark } from './colors';

const ThemeContext = createContext(null);
const STORAGE_KEY = '@suyolink/theme';
const MODES = ['light', 'dark', 'system'];

export function ThemeProvider({ children }) {
  const deviceScheme = useColorScheme();
  const [themeMode, setMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((mode) => {
        if (active && MODES.includes(mode)) setMode(mode);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => {
    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'system' && deviceScheme === 'dark');
    const setThemeMode = (mode) => {
      if (!MODES.includes(mode))
        return Promise.reject(new Error('Invalid appearance mode.'));
      setMode(mode);
      writes.current = writes.current
        .catch(() => {})
        .then(() => AsyncStorage.setItem(STORAGE_KEY, mode));
      return writes.current;
    };
    return {
      themeMode,
      isLoading,
      isDark,
      colors: isDark ? dark : light,
      setThemeMode,
      toggleTheme: () => setThemeMode(isDark ? 'light' : 'dark'),
    };
  }, [themeMode, deviceScheme, isLoading]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
