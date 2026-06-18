import { useState, useRef, useCallback } from 'react';

export const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedFunction = useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  return { debouncedFunction, cancel };
};

export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useRef(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
