import { useState, useEffect, useCallback } from 'react';

/**
 * useCountdown Hook
 * Premium Sports Field Booking Platform
 *
 * Counts down from a given number of seconds to zero.
 * Useful for OTP expiry timers, booking hold timers, and session timeouts.
 *
 * @param {number}  initialSeconds - Starting count in seconds.
 * @param {object}  [options]
 * @param {boolean} [options.autoStart=true]  - Start immediately on mount.
 * @param {Function}[options.onComplete]       - Callback fired when timer hits 0.
 *
 * @returns {{
 *   seconds: number,
 *   isRunning: boolean,
 *   isComplete: boolean,
 *   start: Function,
 *   pause: Function,
 *   reset: Function,
 *   formatted: string,   - MM:SS string
 * }}
 *
 * @example
 * const { formatted, isComplete, reset } = useCountdown(120, {
 *   onComplete: () => setOtpExpired(true)
 * });
 * <p>OTP expires in {formatted}</p>
 */
const useCountdown = (initialSeconds, options = {}) => {
  const { autoStart = true, onComplete } = options;

  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || seconds <= 0) return;

    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, seconds, onComplete]);

  const start = useCallback(() => {
    if (seconds > 0) setIsRunning(true);
  }, [seconds]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback((newSeconds) => {
    setIsRunning(false);
    setSeconds(newSeconds ?? initialSeconds);
  }, [initialSeconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return {
    seconds,
    isRunning,
    isComplete: seconds === 0,
    start,
    pause,
    reset,
    formatted: `${mm}:${ss}`,
  };
};

export default useCountdown;
