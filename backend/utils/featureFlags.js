export const featureFlags = {
  flags: {},
  enable(name) { this.flags[name] = true; },
  disable(name) { this.flags[name] = false; },
  isEnabled(name) { return this.flags[name] || false; },
  setAll(flags) { this.flags = flags; },
  getAll() { return this.flags; }
};
