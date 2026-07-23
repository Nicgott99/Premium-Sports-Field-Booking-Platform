import { useRef, useEffect, useState } from 'react';

/**
 * useResizeObserver Hook
 * Premium Sports Field Booking Platform
 *
 * Observes changes to an element's size using the ResizeObserver API.
 * Returns the element's current content-box dimensions and a ref to
 * attach to the target element. Ideal for building responsive components
 * that need to react to their own size rather than the viewport.
 *
 * @returns {{
 *   ref: React.RefObject,
 *   width: number,
 *   height: number,
 *   entry: ResizeObserverEntry | null,
 * }}
 *
 * @example
 * // Show a compact layout when the container is narrower than 400px
 * const { ref, width } = useResizeObserver();
 * <div ref={ref} className={width < 400 ? 'flex-col' : 'flex-row'}>...</div>
 *
 * @example
 * // Dynamically size a canvas to its wrapper
 * const { ref, width, height } = useResizeObserver();
 * <div ref={ref}>
 *   <canvas width={width} height={height} />
 * </div>
 */
const useResizeObserver = () => {
  const ref = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, entry: null });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!('ResizeObserver' in window)) {
      // Fallback: read initial size via getBoundingClientRect
      const rect = node.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height, entry: null });
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      // Use contentBoxSize when available (more precise than borderBoxSize)
      const { inlineSize: width, blockSize: height } =
        entry.contentBoxSize?.[0] ?? { inlineSize: entry.contentRect.width, blockSize: entry.contentRect.height };

      setDimensions({ width, height, entry });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width: dimensions.width, height: dimensions.height, entry: dimensions.entry };
};

export default useResizeObserver;
