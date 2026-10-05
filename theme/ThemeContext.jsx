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
    return {
      themeMode: 'light',
      isLoading: false,
      isDark: false,
      colors: light,
      setThemeMode: () => Promise.resolve(),
    };
  }, []);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
