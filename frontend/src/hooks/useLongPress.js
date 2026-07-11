import { useRef, useCallback } from 'react';

/**
 * useLongPress Hook
 * Premium Sports Field Booking Platform
 *
 * Detects a long-press gesture on any element. Returns event handlers to
 * spread onto the target element. Useful for mobile context menus, bulk
 * selection mode triggers, and hold-to-confirm delete actions.
 *
 * @param {Function} onLongPress     - Callback fired after the threshold is held.
 * @param {Function} [onClick]       - Optional callback fired on a normal tap/click.
 * @param {object}   [options]
 * @param {number}   [options.threshold=500] - Hold duration in ms before firing.
 * @param {boolean}  [options.captureEvent=false] - Whether to capture the event.
 *
 * @returns {object} - Spread these props onto your target element.
 *
 * @example
 * const handlers = useLongPress(() => setSelectionMode(true), undefined, { threshold: 600 });
 * <div {...handlers}>Hold me</div>
 */
const useLongPress = (onLongPress, onClick, options = {}) => {
  const { threshold = 500, captureEvent = false } = options;

  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const start = useCallback(
    (event) => {
      if (captureEvent) event.persist?.();
      isLongPress.current = false;
      timerRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(event);
      }, threshold);
    },
    [onLongPress, threshold, captureEvent]
  );

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick(event);
      }
      isLongPress.current = false;
    },
    [onClick]
  );

  return {
    onMouseDown: (e) => start(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => clear(e, false),
    onTouchStart: (e) => start(e),
    onTouchEnd: (e) => clear(e),
  };
};

export default useLongPress;
