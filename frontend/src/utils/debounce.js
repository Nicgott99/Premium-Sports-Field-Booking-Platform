/**
 * debounce.js — Pure debounce & throttle utilities
 * Premium Sports Field Booking Platform — Frontend
 *
 * Framework-agnostic implementations that work outside React:
 *  - `debounce(fn, wait, options)` — delays fn until after `wait` ms of silence
 *  - `throttle(fn, wait, options)` — limits fn to once per `wait` ms
 *  - `debounceAsync(fn, wait)` — debounce for async functions, cancels in-flight calls
 *  - `memoize(fn, resolver)` — memoize with optional custom key resolver
 *
 * All returned functions expose `.cancel()` and `.flush()` methods.
 */

// ─────────────────────────────────────────────────────────────────────────────
// debounce
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a debounced version of `fn` that delays invocation until after
 * `wait` milliseconds have elapsed since the last call.
 *
 * @param {Function} fn        - Function to debounce
 * @param {number}   wait      - Delay in milliseconds (default: 300)
 * @param {object}   [options]
 * @param {boolean}  [options.leading=false]  - Invoke on the leading edge
 * @param {boolean}  [options.trailing=true]  - Invoke on the trailing edge
 * @param {number}   [options.maxWait]        - Maximum time fn may be delayed
 * @returns {Function} Debounced function with `.cancel()` and `.flush()`
 *
 * @example
 * const debouncedSearch = debounce((q) => fetchResults(q), 400);
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce(fn, wait = 300, options = {}) {
  const { leading = false, trailing = true, maxWait } = options;

  let timerId = null;
  let maxTimerId = null;
  let lastCallTime = null;
  let lastInvokeTime = 0;
  let lastArgs = null;
  let lastThis = null;
  let result;

  const invoke = () => {
    lastInvokeTime = Date.now();
    const args = lastArgs;
    const ctx = lastThis;
    lastArgs = lastThis = null;
    result = fn.apply(ctx, args);
    return result;
  };

  const startTimer = (ms, cb) => setTimeout(cb, ms);
  const cancelTimer = (id) => clearTimeout(id);

  const leadingEdge = () => {
    lastInvokeTime = Date.now();
    timerId = startTimer(wait, timerExpired);
    if (leading) {
      result = fn.apply(lastThis, lastArgs);
    }
    return result;
  };

  const remainingWait = (time) => {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time) => {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge();
    }
    timerId = startTimer(remainingWait(time), timerExpired);
    return undefined;
  };

  const trailingEdge = () => {
    timerId = null;
    if (trailing && lastArgs) {
      return invoke();
    }
    lastArgs = lastThis = null;
    return result;
  };

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === null) {
        return leadingEdge();
      }
      if (maxWait !== undefined) {
        timerId = startTimer(wait, timerExpired);
        return invoke();
      }
    }

    if (timerId === null) {
      timerId = startTimer(wait, timerExpired);
    }

    // Start maxWait timer if specified and not already running
    if (maxWait !== undefined && maxTimerId === null) {
      maxTimerId = startTimer(maxWait, () => {
        maxTimerId = null;
        if (timerId !== null) {
          cancelTimer(timerId);
          timerId = null;
          trailingEdge();
        }
      });
    }

    return result;
  }

  /** Cancel any pending invocation */
  debounced.cancel = () => {
    if (timerId !== null) { cancelTimer(timerId); timerId = null; }
    if (maxTimerId !== null) { cancelTimer(maxTimerId); maxTimerId = null; }
    lastArgs = lastThis = lastCallTime = null;
    lastInvokeTime = 0;
  };

  /** Immediately invoke any pending invocation and cancel the timer */
  debounced.flush = () => {
    if (timerId === null) { return result; }
    return trailingEdge();
  };

  /** Returns true if there is a pending invocation */
  debounced.pending = () => timerId !== null;

  return debounced;
}

// ─────────────────────────────────────────────────────────────────────────────
// throttle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a throttled version of `fn` that is invoked at most once per
 * `wait` milliseconds.
 *
 * @param {Function} fn      - Function to throttle
 * @param {number}   wait    - Minimum interval in milliseconds (default: 300)
 * @param {object}   [options]
 * @param {boolean}  [options.leading=true]   - Invoke on the leading edge
 * @param {boolean}  [options.trailing=true]  - Invoke on the trailing edge
 * @returns {Function} Throttled function with `.cancel()` and `.flush()`
 *
 * @example
 * const throttledScroll = throttle(() => updateNavbar(), 200);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(fn, wait = 300, options = {}) {
  const { leading = true, trailing = true } = options;
  return debounce(fn, wait, { leading, trailing, maxWait: wait });
}

// ─────────────────────────────────────────────────────────────────────────────
// debounceAsync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Debounces an async function. Only the latest call's promise resolves;
 * earlier in-flight calls are silently discarded (not rejected).
 *
 * @param {Function} asyncFn  - Async function to debounce
 * @param {number}   wait     - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced async function with `.cancel()`
 *
 * @example
 * const search = debounceAsync(async (query) => {
 *   const res = await api.search(query);
 *   return res.data;
 * }, 400);
 *
 * // In a React component:
 * const results = await search(inputValue);
 */
export function debounceAsync(asyncFn, wait = 300) {
  let timerId = null;
  let resolveRef = null;
  let rejectRef = null;
  let callId = 0;

  function debouncedAsync(...args) {
    // Cancel previous pending timer
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }

    // Reject the previous promise (caller ignores discarded calls)
    if (rejectRef) {
      rejectRef({ cancelled: true });
    }

    const currentCallId = ++callId;

    return new Promise((resolve, reject) => {
      resolveRef = resolve;
      rejectRef = reject;

      timerId = setTimeout(async () => {
        timerId = null;
        // Guard: only process the latest call
        if (currentCallId !== callId) { return; }
        try {
          const result = await asyncFn(...args);
          if (currentCallId === callId) { resolve(result); }
        } catch (err) {
          if (currentCallId === callId) { reject(err); }
        }
      }, wait);
    });
  }

  debouncedAsync.cancel = () => {
    if (timerId !== null) { clearTimeout(timerId); timerId = null; }
    if (rejectRef) { rejectRef({ cancelled: true }); }
    resolveRef = rejectRef = null;
    callId++;
  };

  return debouncedAsync;
}

// ─────────────────────────────────────────────────────────────────────────────
// memoize
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a memoized version of `fn`. Results are cached by the first
 * argument (or by the value returned from `resolver`).
 *
 * @param {Function}  fn          - Function to memoize
 * @param {Function} [resolver]   - Custom cache-key resolver (receives same args as fn)
 * @returns {Function} Memoized function with `.cache` (Map) and `.clear()`
 *
 * @example
 * const getPriceBreakdown = memoize((fieldId) => expensiveCalc(fieldId));
 * getPriceBreakdown('field-123'); // computed
 * getPriceBreakdown('field-123'); // cached
 * getPriceBreakdown.clear();      // wipe cache
 */
export function memoize(fn, resolver) {
  const cache = new Map();

  function memoized(...args) {
    const key = resolver ? resolver(...args) : args[0];
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.delete = (key) => cache.delete(key);
  memoized.has = (key) => cache.has(key);

  return memoized;
}

// ─────────────────────────────────────────────────────────────────────────────
// once
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a function that is invoked only once. Subsequent calls return the
 * result of the first invocation.
 *
 * @param {Function} fn  - Function to wrap
 * @returns {Function}   - Once-wrapped function with `.reset()` to re-enable
 *
 * @example
 * const initAnalytics = once(() => analytics.init(config));
 * initAnalytics(); // runs
 * initAnalytics(); // no-op, returns first result
 */
export function once(fn) {
  let called = false;
  let result;

  function onced(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  }

  onced.reset = () => { called = false; result = undefined; };

  return onced;
}
