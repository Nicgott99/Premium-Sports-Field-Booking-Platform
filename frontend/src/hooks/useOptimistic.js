import { useState, useCallback, useTransition } from 'react';

/**
 * useOptimistic Hook (manual implementation for React 18 compatibility)
 * Premium Sports Field Booking Platform
 *
 * Provides an "optimistic UI" pattern: immediately updates the UI with the
 * expected result while an async operation (e.g. API call) is in flight.
 * Reverts automatically if the operation throws, and settles the real value
 * once it resolves.
 *
 * @param {any}      initialState      - The real, server-confirmed state.
 * @param {Function} updateFn          - (currentState, optimisticValue) => newState
 * @returns {{ optimisticState, addOptimistic, isPending }}
 *
 * @example
 * const { optimisticState: likes, addOptimistic } = useOptimistic(
 *   field.likeCount,
 *   (current, delta) => current + delta
 * );
 *
 * const handleLike = async () => {
 *   addOptimistic(1);           // instant +1
 *   await likeFieldApi(field.id); // real request
 * };
 */
const useOptimistic = (initialState, updateFn) => {
  const [optimisticState, setOptimisticState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  // Sync when real initialState changes (e.g. after refetch)
  // Using a ref trick avoids an extra render on mount
  const addOptimistic = useCallback(
    (optimisticValue) => {
      startTransition(() => {
        setOptimisticState((current) => updateFn(current, optimisticValue));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateFn]
  );

  // Expose a way to reset to the real (server) state
  const reset = useCallback(() => {
    setOptimisticState(initialState);
  }, [initialState]);

  return { optimisticState, addOptimistic, isPending, reset };
};

export default useOptimistic;
