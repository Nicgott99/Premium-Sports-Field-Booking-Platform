export const batchProcess = async (items, batchSize, processor) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
};

export const asyncQueue = (concurrency = 3) => {
  let running = 0;
  const queue = [];

  const run = async () => {
    if (running >= concurrency || queue.length === 0) return;
    running++;
    const { task, resolve, reject } = queue.shift();
    try {
      const result = await task();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      running--;
      run();
    }
  };

  return {
    add: (task) => new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      run();
    }),
  };
};
