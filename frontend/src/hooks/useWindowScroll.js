import { useState, useEffect } from 'react';

/**
 * useWindowScroll Hook
 * Premium Sports Field Booking Platform
 *
 * A custom React hook to track the window's X and Y scroll position.
 * Useful for building sticky headers or triggering scroll-based animations.
 * 
 * @returns {object} - An object containing { x, y } scroll coordinates.
 */
const useWindowScroll = () => {
  const [scrollPos, setScrollPos] = useState({
    x: typeof window !== 'undefined' ? window.scrollX : 0,
    y: typeof window !== 'undefined' ? window.scrollY : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const updateScrollPos = () => {
      setScrollPos({
        x: window.scrollX,
        y: window.scrollY,
      });
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollPos);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollPos;
};

export default useWindowScroll;
