import { useRef, useCallback } from 'react';

/**
 * useDebouncedCallback Hook
 * Premium Sports Field Booking Platform
 *
 * Returns a debounced version of a callback function. Unlike `useDebounce`
 * which debounces a value, this hook debounces the *invocation* of a function.
 * Ideal for search inputs, auto-save triggers, and resize handlers.
 *
 * @param {Function} fn        - The callback to debounce.
 * @param {number}   delay     - Debounce delay in milliseconds.
 * @returns {Function}         - Debounced version of `fn`. Call `.cancel()` to clear the pending timer.
 *
 * @example
 * const handleSearch = useDebouncedCallback((query) => {
 *   fetchResults(query);
 * }, 400);
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
const useDebouncedCallback = (fn, delay) => {
  const timerRef = useRef(null);
  const fnRef = useRef(fn);

  // Keep fnRef current so callers don't need to worry about stale closures
  fnRef.current = fn;

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Allow manual cancellation
  debounced.cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return debounced;
};

export default useDebouncedCallback;
