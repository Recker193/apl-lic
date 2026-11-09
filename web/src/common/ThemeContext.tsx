import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccentPreset = 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

export interface AccentColor {
  id: AccentPreset;
  name: string;
  preview: string;
  primaryLight: string;
  primaryHoverLight: string;
  primaryDark: string;
  primaryHoverDark: string;
  schoolLight: string;
  schoolBgLight: string;
  schoolDark: string;
  schoolBgDark: string;
}

export const ACCENT_PRESETS: AccentColor[] = [
  {
    id: 'purple',
    name: 'Oktapod Violet',
    preview: '#8b5cf6',
    primaryLight: '#8b5cf6',
    primaryHoverLight: '#7c3aed',
    primaryDark: '#a78bfa',
    primaryHoverDark: '#c4b5fd',
    schoolLight: '#7c3aed',
    schoolBgLight: '#f3e8ff',
    schoolDark: '#a78bfa',
    schoolBgDark: '#2e1065',
  },
  {
    id: 'cyan',
    name: 'Ocean Cyan',
    preview: '#06b6d4',
    primaryLight: '#0891b2',
    primaryHoverLight: '#0e7490',
    primaryDark: '#22d3ee',
    primaryHoverDark: '#67e8f9',
    schoolLight: '#0891b2',
    schoolBgLight: '#ecfeff',
    schoolDark: '#22d3ee',
    schoolBgDark: '#083344',
  },
  {
    id: 'emerald',
    name: 'Smarald Tonic',
    preview: '#10b981',
    primaryLight: '#059669',
    primaryHoverLight: '#047857',
    primaryDark: '#34d399',
    primaryHoverDark: '#6ee7b7',
    schoolLight: '#059669',
    schoolBgLight: '#ecfdf5',
    schoolDark: '#34d399',
    schoolBgDark: '#064e3b',
  },
  {
    id: 'blue',
    name: 'Classic Indigo',
    preview: '#3b82f6',
    primaryLight: '#2563eb',
    primaryHoverLight: '#1d4ed8',
    primaryDark: '#60a5fa',
    primaryHoverDark: '#93c5fd',
    schoolLight: '#2563eb',
    schoolBgLight: '#eff6ff',
    schoolDark: '#60a5fa',
    schoolBgDark: '#1e3a8a',
  },
  {
    id: 'amber',
    name: 'Solar Amber',
    preview: '#f59e0b',
    primaryLight: '#d97706',
    primaryHoverLight: '#b45309',
    primaryDark: '#fbbf24',
    primaryHoverDark: '#fcd34d',
    schoolLight: '#d97706',
    schoolBgLight: '#fffbeb',
    schoolDark: '#fbbf24',
    schoolBgDark: '#451a03',
  },
  {
    id: 'rose',
    name: 'Coral Rose',
    preview: '#f43f5e',
    primaryLight: '#e11d48',
    primaryHoverLight: '#be123c',
    primaryDark: '#fb7185',
    primaryHoverDark: '#fda4af',
    schoolLight: '#e11d48',
    schoolBgLight: '#fff1f2',
    schoolDark: '#fb7185',
    schoolBgDark: '#4c0519',
  },
];

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  accent: AccentPreset;
  setAccent: (accent: AccentPreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('oktapod_theme') === 'dark';
  });

  const [accent, setAccentState] = useState<AccentPreset>(() => {
    const saved = localStorage.getItem('oktapod_accent') as AccentPreset;
    return ACCENT_PRESETS.some((p) => p.id === saved) ? saved : 'purple';
  });

  // Apply dark mode attribute
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('oktapod_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('oktapod_theme', 'light');
    }
  }, [isDarkMode]);

  // Apply accent attribute & CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('oktapod_accent', accent);
    
    const preset = ACCENT_PRESETS.find((p) => p.id === accent) || ACCENT_PRESETS[0];
    const root = document.documentElement;

    if (isDarkMode) {
      root.style.setProperty('--primary', preset.primaryDark);
      root.style.setProperty('--primary-hover', preset.primaryHoverDark);
      root.style.setProperty('--mobile-school-color', preset.schoolDark);
      root.style.setProperty('--mobile-school-color-light', preset.schoolBgDark);
    } else {
      root.style.setProperty('--primary', preset.primaryLight);
      root.style.setProperty('--primary-hover', preset.primaryHoverLight);
      root.style.setProperty('--mobile-school-color', preset.schoolLight);
      root.style.setProperty('--mobile-school-color-light', preset.schoolBgLight);
    }
  }, [accent, isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setAccent = (newAccent: AccentPreset) => {
    setAccentState(newAccent);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

