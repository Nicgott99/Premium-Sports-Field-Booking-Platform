const requestCache = new Map();
const CACHE_TTL = 5000;

export const deduplicateRequest = (key, fn) => {
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }

  const promise = fn().finally(() => {
    setTimeout(() => requestCache.delete(key), CACHE_TTL);
  });

  requestCache.set(key, promise);
  return promise;
};

export const clearRequestCache = () => requestCache.clear();

export const deduplicationMiddleware = (req, res, next) => {
  const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  req.dedupeKey = cacheKey;
  next();
};
