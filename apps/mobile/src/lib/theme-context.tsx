import React, { createContext, useContext } from 'react';

const colors = {
  background: '#09090b',
  surface: '#18181b',
  surfaceBorder: '#27272a',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textMuted: '#d4d4d8',
  brand: '#3b82f6',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#eab308',
  orange: '#f97316',
  tabBar: '#18181b',
  tabBarBorder: '#27272a',
  headerBackground: '#18181b',
  markAllBtn: '#27272a',
  markAllText: '#e4e4e7',
  typeBadgeBg: '#27272a',
  typeBadgeText: '#a1a1aa',
  outageCardBg: '#1c1917',
  outageCardBorder: '#44403c',
  outageTitle: '#fca5a5',
  outageArea: '#f87171',
  logoutBg: '#451a1a',
  logoutText: '#f87171',
  meterItemBg: '#09090b',
  devSectionBg: '#18181b',
  devSectionBorder: '#27272a',
  devTitle: '#a1a1aa',
  devButtonBorder: '#3f3f46',
  devButtonText: '#a1a1aa',
  inputBg: '#18181b',
  inputBorder: '#3f3f46',
};

export type ThemeColors = typeof colors;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ isDark: true, colors, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
