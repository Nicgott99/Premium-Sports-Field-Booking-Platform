import { useState, useEffect } from 'react';

/**
 * useCountUp Hook
 * Premium Sports Field Booking Platform
 *
 * A custom React hook that animates a numeric value from a starting number
 * to a target ending number using requestAnimationFrame for smooth 60fps rendering.
 * Excellent for dashboard metrics, wallet page balances, and leaderboard points.
 *
 * @param {number} end         - Target end value to count up to.
 * @param {number} [start=0]   - Initial starting value.
 * @param {number} [duration=1500] - Duration of the animation in milliseconds.
 * @returns {number}           - The current animated count.
 */
const useCountUp = (end, start = 0, duration = 1500) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = Number(end);
    const startValue = Number(start);

    // If starting and ending values are the same, skip animation
    if (startValue === endValue) {
      setCount(endValue);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out quadratic function (starts fast, slows down at the end)
      const easeOutQuad = progress * (2 - progress);
      
      const currentValue = Math.floor(easeOutQuad * (endValue - startValue) + startValue);
      setCount(currentValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    const animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [end, start, duration]);

  return count;
};

export default useCountUp;
