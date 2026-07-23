import { useState, useEffect, useRef } from 'react';

/**
 * useIntersectionObserver Hook
 * Premium Sports Field Booking Platform
 *
 * Observes when an element enters or leaves the viewport using the
 * Intersection Observer API. Ideal for lazy-loading content, triggering
 * scroll animations, and infinite scroll thresholds.
 *
 * @param {IntersectionObserverInit} [options] - Standard IntersectionObserver options.
 * @param {boolean} [triggerOnce=false] - If true, stops observing after first intersection.
 * @returns {[React.RefObject, boolean, IntersectionObserverEntry|null]}
 *   - ref      → attach to the target element
 *   - isVisible → whether the element is currently intersecting
 *   - entry    → the raw IntersectionObserverEntry for advanced usage
 *
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 }, true);
 * <div ref={ref} className={isVisible ? 'animate-fade-in' : 'opacity-0'}>...</div>
 */
const useIntersectionObserver = (options = {}, triggerOnce = false) => {
  const [isVisible, setIsVisible] = useState(false);
  const [entry, setEntry] = useState(null);
  const ref = useRef(null);
  const frozen = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || frozen.current) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: treat as always visible in environments without support
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([observerEntry]) => {
      setEntry(observerEntry);
      setIsVisible(observerEntry.isIntersecting);

      if (observerEntry.isIntersecting && triggerOnce) {
        frozen.current = true;
        observer.disconnect();
      }
    }, options);

    observer.observe(node);

    return () => observer.disconnect();
  }, [options.root, options.rootMargin, options.threshold, triggerOnce]);

  return [ref, isVisible, entry];
};

export default useIntersectionObserver;
