import { useEffect, useRef } from 'react';

/**
 * useEventListener Hook
 * Premium Sports Field Booking Platform
 *
 * Attaches an event listener to any target (window, document, a ref'd element,
 * or a custom EventTarget) and cleans it up automatically on unmount or when
 * dependencies change. Keeps the handler ref current to prevent stale closures.
 *
 * @param {string}        eventName  - DOM event name, e.g. 'click', 'keydown', 'resize'.
 * @param {Function}      handler    - The event callback.
 * @param {object|Window} [target]   - Defaults to window. Pass a React ref or an EventTarget.
 * @param {object|boolean}[options]  - addEventListener options (passive, capture, once).
 *
 * @example
 * // Global keyboard shortcut
 * useEventListener('keydown', (e) => {
 *   if (e.key === 'Escape') closeModal();
 * });
 *
 * // On a specific element via ref
 * const buttonRef = useRef(null);
 * useEventListener('click', handleClick, buttonRef);
 *
 * // Passive scroll listener
 * useEventListener('scroll', onScroll, window, { passive: true });
 */
const useEventListener = (eventName, handler, target = window, options = {}) => {
  const handlerRef = useRef(handler);

  // Always keep ref current so callers never get a stale closure
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Support React refs ({ current: Element }) or direct EventTargets
    const element = target?.current ?? target;

    if (!element?.addEventListener) return;

    const listener = (event) => handlerRef.current(event);

    element.addEventListener(eventName, listener, options);

    return () => element.removeEventListener(eventName, listener, options);
  }, [eventName, target]);
};

export default useEventListener;
