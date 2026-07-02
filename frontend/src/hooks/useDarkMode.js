import { useState, useEffect } from 'react';

/**
 * useDarkMode Hook
 * Premium Sports Field Booking Platform
 *
 * Manages dark/light mode preference, persisting the user's choice in
 * localStorage and synchronizing with the system's `prefers-color-scheme`.
 * Applies/removes the "dark" class on <html> for Tailwind CSS dark mode.
 *
 * @returns {{ isDark: boolean, toggle: Function, setDark: Function }}
 */
const useDarkMode = () => {
  const STORAGE_KEY = 'theme-preference';

  const getInitialMode = () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === 'dark';
    } catch (_) {
      // ignore
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDark, setIsDark] = useState(getInitialMode);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (_) {
      // ignore storage errors
    }
  }, [isDark]);

  // Listen for OS-level preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only follow OS change if the user hasn't explicitly set a preference
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle, setDark: setIsDark };
};

export default useDarkMode;
