import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {}

const THEME_KEY = 'egx_theme';

function getStoredTheme(): 'light' | 'dark' | null {
  try {
    if (Platform.OS === 'web') {
      const val = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      return val === 'dark' ? 'dark' : val === 'light' ? 'light' : null;
    }
    const val = SecureStore?.getItem?.(THEME_KEY) ?? null;
    return val === 'dark' ? 'dark' : val === 'light' ? 'light' : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: 'light' | 'dark'): void {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(THEME_KEY, theme);
    } else {
      SecureStore?.setItem?.(THEME_KEY, theme);
    }
  } catch {}
}

const lightColors = {
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceBorder: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textMuted: '#4b5563',
  brand: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#ca8a04',
  orange: '#ea580c',
  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  headerBackground: '#ffffff',
  // Specific surfaces
  markAllBtn: '#f3f4f6',
  markAllText: '#374151',
  typeBadgeBg: '#f3f4f6',
  typeBadgeText: '#6b7280',
  outageCardBg: '#fef2f2',
  outageCardBorder: '#fecaca',
  outageTitle: '#991b1b',
  outageArea: '#b91c1c',
  logoutBg: '#fee2e2',
  logoutText: '#dc2626',
  meterItemBg: '#f9fafb',
  devSectionBg: '#fefce8',
  devSectionBorder: '#fde68a',
  devTitle: '#92400e',
  devButtonBorder: '#fde68a',
  devButtonText: '#92400e',
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
};

const darkColors: typeof lightColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceBorder: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textMuted: '#cbd5e1',
  brand: '#3b82f6',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#eab308',
  orange: '#f97316',
  tabBar: '#1e293b',
  tabBarBorder: '#334155',
  headerBackground: '#1e293b',
  // Specific surfaces
  markAllBtn: '#334155',
  markAllText: '#e2e8f0',
  typeBadgeBg: '#334155',
  typeBadgeText: '#94a3b8',
  outageCardBg: '#451a1a',
  outageCardBorder: '#7f1d1d',
  outageTitle: '#fca5a5',
  outageArea: '#f87171',
  logoutBg: '#451a1a',
  logoutText: '#f87171',
  meterItemBg: '#0f172a',
  devSectionBg: '#422006',
  devSectionBorder: '#a16207',
  devTitle: '#fbbf24',
  devButtonBorder: '#a16207',
  devButtonText: '#fbbf24',
  inputBg: '#1e293b',
  inputBorder: '#475569',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored === 'dark') setIsDark(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      storeTheme(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
