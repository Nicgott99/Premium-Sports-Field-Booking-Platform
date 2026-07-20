import { useState, useCallback, useRef } from 'react';

/**
 * useSearch Hook
 * Premium Sports Field Booking Platform
 *
 * Manages all state for a search UI: the query string, debounced value,
 * loading state, results, and error. Works with any async search function
 * (API call, local filter, etc.).
 *
 * @param {Function} searchFn   - async (query: string) => results[]
 * @param {object}   [options]
 * @param {number}   [options.debounceMs=350]   - Delay before firing searchFn.
 * @param {number}   [options.minLength=1]       - Minimum chars before searching.
 * @param {any[]}    [options.initialResults=[]] - Default results before first search.
 *
 * @returns {{
 *   query: string,
 *   setQuery: Function,
 *   results: any[],
 *   isLoading: boolean,
 *   error: string|null,
 *   clear: Function,
 * }}
 *
 * @example
 * const { query, setQuery, results, isLoading } = useSearch(
 *   (q) => api.get(`/fields?search=${q}`).then(r => r.data),
 *   { debounceMs: 400, minLength: 2 }
 * );
 */
const useSearch = (searchFn, options = {}) => {
  const { debounceMs = 350, minLength = 1, initialResults = [] } = options;

  const [query, setQueryState] = useState('');
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const requestIdRef = useRef(0);  // Stale-response guard

  const setQuery = useCallback(
    (value) => {
      setQueryState(value);
      setError(null);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!value || value.length < minLength) {
        setResults(initialResults);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const requestId = ++requestIdRef.current;

      timerRef.current = setTimeout(async () => {
        try {
          const data = await searchFn(value);
          // Discard stale responses (user typed ahead)
          if (requestId === requestIdRef.current) {
            setResults(data ?? []);
          }
        } catch (err) {
          if (requestId === requestIdRef.current) {
            setError(err?.message || 'Search failed. Please try again.');
            setResults([]);
          }
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
          }
        }
      }, debounceMs);
    },
    [searchFn, debounceMs, minLength, initialResults]
  );

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueryState('');
    setResults(initialResults);
    setIsLoading(false);
    setError(null);
  }, [initialResults]);

  return { query, setQuery, results, isLoading, error, clear };
};

export default useSearch;
