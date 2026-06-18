import { useState, useEffect, useCallback } from 'react';

export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
      throw err;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error, isLoading: status === 'pending' };
};

export const useAsyncRetry = (asyncFunction, maxRetries = 3, delayMs = 1000) => {
  const [retryCount, setRetryCount] = useState(0);
  const { status, data, error, execute: baseExecute, ...rest } = useAsync(
    asyncFunction,
    false
  );

  const execute = useCallback(async () => {
    try {
      return await baseExecute();
    } catch (err) {
      if (retryCount < maxRetries) {
        setRetryCount(retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return execute();
      }
      throw err;
    }
  }, [baseExecute, retryCount, maxRetries, delayMs]);

  return {
    status,
    data,
    error,
    execute,
    retryCount,
    canRetry: retryCount < maxRetries,
    ...rest,
  };
};
