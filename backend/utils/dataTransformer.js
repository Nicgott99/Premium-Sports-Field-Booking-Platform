export const transformer = {
  transform(data, schema) {
    const result = {};
    Object.entries(schema).forEach(([key, fn]) => {
      result[key] = fn(data[key]);
    });
    return result;
  },
  batch(items, schema) {
    return items.map(item => this.transform(item, schema));
  },
  normalize(items, key) {
    return items.reduce((acc, item) => {
      acc[item[key]] = item;
      return acc;
    }, {});
  }
};
