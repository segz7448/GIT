import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getTheme, ThemeDefinition } from './themes';
import { radius, space, motion, elevationGlass } from './tokens';

export type ThemeMode = 'system' | 'dark' | 'light';

const THEME_MODE_KEY = 'theme_mode_v1';

interface ThemeContextValue extends ThemeDefinition {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  radius: typeof radius;
  space: typeof space;
  motion: typeof motion;
  elevationGlass: typeof elevationGlass;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null, live-updates with OS setting
  const [mode, setModeState] = useState<ThemeMode>('dark'); // dark by default until persisted value loads
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_MODE_KEY)
      .then((stored) => {
        if (stored === 'system' || stored === 'dark' || stored === 'light') {
          setModeState(stored);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(THEME_MODE_KEY, next).catch(() => {
      // non-fatal - preference just won't survive a restart
    });
  }, []);

  const resolvedScheme: 'dark' | 'light' = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  const theme = useMemo(() => getTheme(resolvedScheme), [resolvedScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...theme, mode, setMode, radius, space, motion, elevationGlass }),
    [theme, mode, setMode]
  );

  // Avoid a flash of the wrong theme while the persisted preference is
  // still loading from SecureStore (typically a couple frames).
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be called within a ThemeProvider (see App.js root)');
  }
  return ctx;
}
