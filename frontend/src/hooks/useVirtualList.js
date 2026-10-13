/**
 * useVirtualList.js — Zero-Dependency Virtual List Hook
 * Premium Sports Booking Platform
 *
 * Efficiently renders only the visible rows of a large list (e.g. hundreds of
 * bookings, fields, or search results) by tracking the scroll position and
 * computing which items fall within the viewport — without any external library.
 *
 * Features:
 *  - Fixed-height OR variable-height items (via itemHeight function)
 *  - Configurable overscan buffer to reduce blank-flash on fast scrolls
 *  - Exposes a `scrollToIndex` imperative handle
 *  - `totalHeight` for a transparent spacer that keeps the scrollbar accurate
 *  - Works with any scrollable container (window or a div)
 *  - Auto-updates on container resize via ResizeObserver
 *
 * Usage (fixed-height):
 * ─────────────────────────────────────────────────────────────────────────────
 * const { containerProps, virtualItems, totalHeight, scrollToIndex } =
 *   useVirtualList({
 *     items: myBookings,              // full data array
 *     itemHeight: 80,                 // pixels per row (fixed)
 *     overscan: 5,                    // extra rows to render above/below viewport
 *   });
 *
 * return (
 *   <div {...containerProps} style={{ height: 500, overflowY: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, item, offsetTop }) => (
 *         <div
 *           key={item.id}
 *           style={{ position: 'absolute', top: offsetTop, width: '100%', height: 80 }}
 *         >
 *           <BookingCard booking={item} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage (variable-height):
 * ─────────────────────────────────────────────────────────────────────────────
 * const { containerProps, virtualItems, totalHeight } = useVirtualList({
 *   items: myFields,
 *   itemHeight: (item, index) => item.hasImage ? 160 : 80,  // dynamic height
 * });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a cumulative offset table for variable-height items.
 * offsets[i] = top pixel position of item i.
 * offsets[items.length] = total scroll height.
 *
 * @param {any[]}             items
 * @param {number|Function}   itemHeight
 * @returns {number[]}
 */
function buildOffsetTable(items, itemHeight) {
  const offsets = new Array(items.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < items.length; i++) {
    const h =
      typeof itemHeight === 'function'
        ? itemHeight(items[i], i)
        : itemHeight;
    offsets[i + 1] = offsets[i] + (Number.isFinite(h) && h > 0 ? h : 40);
  }
  return offsets;
}

/**
 * Binary search: find the first index in offsets where offsets[i] > scrollTop.
 * Used to locate the first visible item efficiently in O(log n).
 *
 * @param {number[]} offsets
 * @param {number}   target
 * @returns {number}
 */
function findFirstVisibleIndex(offsets, target) {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] <= target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return Math.max(0, lo - 1);
}

/**
 * Binary search: find the last index in offsets where offsets[i] < scrollBottom.
 *
 * @param {number[]} offsets
 * @param {number}   target
 * @returns {number}
 */
function findLastVisibleIndex(offsets, target) {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] < target) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} UseVirtualListOptions
 * @property {any[]}          items         - Full data array to virtualise
 * @property {number|Function} itemHeight   - Fixed px height OR (item, index) => px
 * @property {number}         [overscan=3]  - Extra rows rendered above & below viewport
 * @property {number}         [containerHeight] - If omitted, reads from container ref
 */

/**
 * @typedef {object} VirtualItem
 * @property {number} index     - Index in the original `items` array
 * @property {any}    item      - The data item itself
 * @property {number} offsetTop - Top pixel offset inside the total-height container
 * @property {number} height    - Rendered height for this item in pixels
 */

/**
 * @typedef {object} UseVirtualListReturn
 * @property {object}        containerProps  - Spread onto the scroll container div
 * @property {VirtualItem[]} virtualItems    - Only the currently visible (+overscan) items
 * @property {number}        totalHeight     - Total scroll height of the full list
 * @property {number}        startIndex      - First rendered item index
 * @property {number}        endIndex        - Last rendered item index
 * @property {Function}      scrollToIndex   - (index, behavior?) => void
 * @property {object}        ref             - Container ref (attach to scroll div)
 */

/**
 * @param {UseVirtualListOptions} options
 * @returns {UseVirtualListReturn}
 */
export function useVirtualList(options) {
  const {
    items = [],
    itemHeight = 60,
    overscan = 3,
    containerHeight: containerHeightProp,
  } = options;

  const containerRef = useRef(null);
  const [scrollTop, setScrollTop]           = useState(0);
  const [containerHeight, setContainerHeight] = useState(containerHeightProp ?? 400);

  // ── Build offset table (memoised — only rebuilds when items or itemHeight changes) ──
  const offsets = useMemo(
    () => buildOffsetTable(items, itemHeight),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, typeof itemHeight === 'function' ? itemHeight : itemHeight]
  );

  const totalHeight = offsets[offsets.length - 1] ?? 0;

  // ── Handle scroll events ─────────────────────────────────────────────────────
  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // ── Track container size via ResizeObserver ──────────────────────────────────
  useEffect(() => {
    if (containerHeightProp != null) {
      setContainerHeight(containerHeightProp);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    setContainerHeight(el.clientHeight || 400);

    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setContainerHeight(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerHeightProp]);

  // ── Compute visible range ────────────────────────────────────────────────────
  const rawStart = findFirstVisibleIndex(offsets, scrollTop);
  const rawEnd   = findLastVisibleIndex(offsets, scrollTop + containerHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex   = Math.min(items.length - 1, rawEnd + overscan);

  // ── Build virtual items list ─────────────────────────────────────────────────
  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (i < 0 || i >= items.length) continue;
      result.push({
        index:     i,
        item:      items[i],
        offsetTop: offsets[i],
        height:    offsets[i + 1] - offsets[i],
      });
    }
    return result;
  }, [startIndex, endIndex, items, offsets]);

  // ── Imperative scroll-to-index ───────────────────────────────────────────────
  const scrollToIndex = useCallback(
    (index, behavior = 'smooth') => {
      const el = containerRef.current;
      if (!el || index < 0 || index >= items.length) return;
      const targetOffset = offsets[index] ?? 0;
      el.scrollTo({ top: targetOffset, behavior });
    },
    [offsets, items.length]
  );

  // ── Props to spread onto the container div ───────────────────────────────────
  const containerProps = {
    ref: containerRef,
    onScroll,
    style: { overflowY: 'auto', position: 'relative' },
  };

  return {
    containerProps,
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex,
    ref: containerRef,
  };
}

// ─── Convenience: useWindowVirtualList ───────────────────────────────────────

/**
 * Variant that listens to the browser window scroll instead of a container div.
 * Useful for full-page virtualised lists (e.g. the Fields browse page).
 *
 * @param {object} options
 * @param {any[]}             options.items
 * @param {number|Function}   options.itemHeight
 * @param {number}            [options.overscan=3]
 * @param {number}            [options.offsetTop=0] - Top pixel offset of the list in the page
 * @returns {UseVirtualListReturn}
 */
export function useWindowVirtualList({ items = [], itemHeight = 60, overscan = 3, offsetTop = 0 }) {
  const [scrollTop, setScrollTop]       = useState(() => window.scrollY);
  const [windowHeight, setWindowHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    const onScroll = () => setScrollTop(window.scrollY);
    const onResize = () => setWindowHeight(window.innerHeight);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const offsets = useMemo(
    () => buildOffsetTable(items, itemHeight),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, typeof itemHeight === 'function' ? itemHeight : itemHeight]
  );

  const totalHeight = offsets[offsets.length - 1] ?? 0;
  const relativeScroll = Math.max(0, scrollTop - offsetTop);

  const rawStart = findFirstVisibleIndex(offsets, relativeScroll);
  const rawEnd   = findLastVisibleIndex(offsets, relativeScroll + windowHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex   = Math.min(items.length - 1, rawEnd + overscan);

  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (i < 0 || i >= items.length) continue;
      result.push({
        index:     i,
        item:      items[i],
        offsetTop: offsets[i],
        height:    offsets[i + 1] - offsets[i],
      });
    }
    return result;
  }, [startIndex, endIndex, items, offsets]);

  const scrollToIndex = useCallback(
    (index, behavior = 'smooth') => {
      if (index < 0 || index >= items.length) return;
      const targetOffset = (offsets[index] ?? 0) + offsetTop;
      window.scrollTo({ top: targetOffset, behavior });
    },
    [offsets, items.length, offsetTop]
  );

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex,
    containerProps: {},   // no container needed for window scroll
    ref:            null,
  };
}

export default useVirtualList;
