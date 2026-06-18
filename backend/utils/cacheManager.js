const cacheStore = new Map();

export const cacheSet = (key, value, ttl = 3600000) => {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
};

export const cacheGet = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.value;
};

export const cacheInvalidate = (pattern) => {
  const keys = Array.from(cacheStore.keys());
  keys.forEach(key => {
    if (new RegExp(pattern).test(key)) {
      cacheStore.delete(key);
    }
  });
};

export const cacheClear = () => cacheStore.clear();
