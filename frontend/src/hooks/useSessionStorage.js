import { useState, useEffect } from 'react';

/**
 * useSessionStorage Hook
 * Premium Sports Field Booking Platform
 *
 * A custom React hook to sync state with window.sessionStorage.
 * Similar to useLocalStorage but values persist only for the page session.
 *
 * @param {string} key - The sessionStorage key.
 * @param {any} initialValue - The initial value if key doesn't exist.
 * @returns {[any, Function]} State and setter function.
 */
const useSessionStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[useSessionStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`[useSessionStorage] Error setting key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useSessionStorage;
