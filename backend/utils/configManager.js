const config = {};
export const configManager = {
  set(key, value) { config[key] = value; },
  get(key) { return config[key]; },
  all() { return config; },
  has(key) { return key in config; },
  delete(key) { delete config[key]; }
};
