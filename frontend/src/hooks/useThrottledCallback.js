import { useCallback, useRef } from 'react';

/**
 * useThrottledCallback Hook
 * Premium Sports Field Booking Platform
 *
 * Returns a throttled version of a callback that fires at most once
 * per `limit` ms, regardless of how many times it is invoked.
 * Unlike debounce (which delays until quiet), throttle guarantees
 * the first call goes through immediately and subsequent ones are
 * rate-limited. Useful for scroll handlers, window-resize callbacks,
 * and real-time map drag events.
 *
 * @param {Function} fn     - The callback to throttle.
 * @param {number}   limit  - Minimum interval between invocations in ms.
 * @returns {Function}      - Throttled version of `fn`. Call `.cancel()` to reset.
 *
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   updateScrollIndicator(window.scrollY);
 * }, 100);
 * window.addEventListener('scroll', handleScroll);
 */
const useThrottledCallback = (fn, limit) => {
  const lastCalledAt = useRef(0);
  const timerRef = useRef(null);
  const fnRef = useRef(fn);

  // Always keep ref current to avoid stale closures
  fnRef.current = fn;

  const throttled = useCallback(
    (...args) => {
      const now = Date.now();
      const remaining = limit - (now - lastCalledAt.current);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastCalledAt.current = now;
        fnRef.current(...args);
      } else {
        // Schedule a trailing call so the last invocation always fires
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          lastCalledAt.current = Date.now();
          fnRef.current(...args);
        }, remaining);
      }
    },
    [limit]
  );

  throttled.cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastCalledAt.current = 0;
  };

  return throttled;
};

export default useThrottledCallback;
