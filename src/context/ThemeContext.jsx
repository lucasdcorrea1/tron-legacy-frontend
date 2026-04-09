import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('admin-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((mode) => {
    setThemeState(mode);
    localStorage.setItem('admin-theme', mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('admin-theme', next);
      return next;
    });
  }, []);

  // Sync theme attribute on <html> for CSS selectors
  useEffect(() => {
    document.documentElement.setAttribute('data-admin-theme', theme);
    return () => document.documentElement.removeAttribute('data-admin-theme');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
