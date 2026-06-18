export const retry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 2,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoff, attempt - 1);
        
        if (onRetry) {
          onRetry({ attempt, delay, error: err.message });
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${maxAttempts} attempts. Last error: ${lastError.message}`
  );
};

export const retryAsyncOperation = async (
  operation,
  maxRetries = 3,
  shouldRetry = () => true
) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, i)) {
        throw error;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
};

export const retryMiddleware = (maxRetries = 3) => {
  return async (req, res, next) => {
    req.retry = (fn) => retry(fn, { maxAttempts: maxRetries });
    next();
  };
};
