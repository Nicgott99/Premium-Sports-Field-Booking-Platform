import { useReducer, useCallback } from 'react';

/**
 * usePagination Hook
 * Premium Sports Field Booking Platform
 *
 * Manages all state for paginated data lists: current page, page size,
 * total item count, and derived helpers. Works with any data source —
 * server-side (API calls) or client-side array slicing.
 *
 * @param {object} [options]
 * @param {number} [options.initialPage=1]      - Starting page (1-indexed).
 * @param {number} [options.initialPageSize=10] - Items per page.
 * @param {number} [options.total=0]            - Total number of items across all pages.
 *
 * @returns {{
 *   page: number,
 *   pageSize: number,
 *   total: number,
 *   totalPages: number,
 *   offset: number,          - Items to skip (for API ?skip=X or array.slice).
 *   hasPrev: boolean,
 *   hasNext: boolean,
 *   pageNumbers: number[],   - Array of page numbers to render (with -1 for ellipsis).
 *   goToPage: Function,
 *   nextPage: Function,
 *   prevPage: Function,
 *   setPageSize: Function,
 *   setTotal: Function,
 *   reset: Function,
 * }}
 *
 * @example
 * const pagination = usePagination({ initialPageSize: 12, total: apiData.count });
 *
 * useEffect(() => {
 *   fetchFields({ page: pagination.page, limit: pagination.pageSize });
 * }, [pagination.page, pagination.pageSize]);
 *
 * // Render page buttons
 * {pagination.pageNumbers.map(n =>
 *   n === -1
 *     ? <span key={Math.random()}>…</span>
 *     : <button key={n} onClick={() => pagination.goToPage(n)}>{n}</button>
 * )}
 */

const ACTIONS = {
  GO_TO_PAGE: 'GO_TO_PAGE',
  SET_PAGE_SIZE: 'SET_PAGE_SIZE',
  SET_TOTAL: 'SET_TOTAL',
  RESET: 'RESET',
};

const createState = (page, pageSize, total) => ({ page, pageSize, total });

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.GO_TO_PAGE:
      return { ...state, page: action.page };
    case ACTIONS.SET_PAGE_SIZE:
      return { ...state, pageSize: action.pageSize, page: 1 };
    case ACTIONS.SET_TOTAL:
      return { ...state, total: action.total, page: 1 };
    case ACTIONS.RESET:
      return createState(action.initialPage, action.initialPageSize, action.total);
    default:
      return state;
  }
};

/**
 * Build a compact page-number array for rendering pagination buttons.
 * Inserts -1 as a sentinel for ellipsis (…).
 * Always shows first, last, current ±1 pages.
 */
const buildPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1].filter(n => n >= 1 && n <= total));
  const sorted = [...pages].sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(-1); // ellipsis
    result.push(sorted[i]);
  }
  return result;
};

const usePagination = (options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    total: initialTotal = 0,
  } = options;

  const [state, dispatch] = useReducer(
    reducer,
    createState(initialPage, initialPageSize, initialTotal)
  );

  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  const clamp = (p) => Math.min(Math.max(1, p), totalPages);

  const goToPage = useCallback((page) => {
    dispatch({ type: ACTIONS.GO_TO_PAGE, page: clamp(page) });
  }, [totalPages]);

  const nextPage = useCallback(() => {
    dispatch({ type: ACTIONS.GO_TO_PAGE, page: clamp(state.page + 1) });
  }, [state.page, totalPages]);

  const prevPage = useCallback(() => {
    dispatch({ type: ACTIONS.GO_TO_PAGE, page: clamp(state.page - 1) });
  }, [state.page, totalPages]);

  const setPageSize = useCallback((size) => {
    dispatch({ type: ACTIONS.SET_PAGE_SIZE, pageSize: Math.max(1, size) });
  }, []);

  const setTotal = useCallback((total) => {
    dispatch({ type: ACTIONS.SET_TOTAL, total: Math.max(0, total) });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET, initialPage, initialPageSize, total: initialTotal });
  }, [initialPage, initialPageSize, initialTotal]);

  return {
    page: state.page,
    pageSize: state.pageSize,
    total: state.total,
    totalPages,
    offset: (state.page - 1) * state.pageSize,
    hasPrev: state.page > 1,
    hasNext: state.page < totalPages,
    pageNumbers: buildPageNumbers(state.page, totalPages),
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotal,
    reset,
  };
};

export default usePagination;
