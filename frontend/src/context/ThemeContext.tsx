import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: 'dark' | 'light';
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('guansa_theme_mode');
    return (saved as ThemeMode) || 'dark'; // Default to regal #344BC2 dark mode
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateResolved = () => {
      let active: 'dark' | 'light';
      if (mode === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = mode;
      }
      setResolvedTheme(active);

      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(active);
    };

    updateResolved();
    localStorage.setItem('guansa_theme_mode', mode);

    const listener = () => {
      if (mode === 'system') {
        updateResolved();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
