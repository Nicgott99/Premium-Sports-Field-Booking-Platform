import { useEffect } from 'react';

/**
 * useKeyPress Hook
 * Premium Sports Field Booking Platform
 *
 * Custom hook to listen for specific key presses on the window object.
 * Useful for handling shortcuts like 'Escape' to close modals.
 *
 * @param {string|string[]} targetKey - The key or array of keys to listen for (e.g., 'Escape', ['Enter', 'NumpadEnter']).
 * @param {function} handler - The function to call when the key is pressed.
 * @param {object} options - Options object.
 * @param {boolean} [options.preventDefault=false] - Whether to call e.preventDefault().
 * @param {boolean} [options.stopPropagation=false] - Whether to call e.stopPropagation().
 */
const useKeyPress = (targetKey, handler, options = {}) => {
  const { preventDefault = false, stopPropagation = false } = options;

  useEffect(() => {
    if (!targetKey || !handler) {
      return;
    }

    const downHandler = (event) => {
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey];
      
      if (keys.includes(event.key)) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        handler(event);
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [targetKey, handler, preventDefault, stopPropagation]);
};

export default useKeyPress;
