const PREFIX = 'cse471_';

export const storage = {
  set: (key, value, expiresInMinutes = null) => {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiresAt: expiresInMinutes ? Date.now() + expiresInMinutes * 60 * 1000 : null,
      };
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error(`Failed to save to localStorage: ${err.message}`);
      return false;
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(PREFIX + key);
      if (!item) return null;

      const data = JSON.parse(item);

      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }

      return data.value;
    } catch (err) {
      console.error(`Failed to read from localStorage: ${err.message}`);
      return null;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(PREFIX + key);
      return true;
    } catch (err) {
      console.error(`Failed to remove from localStorage: ${err.message}`);
      return false;
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (err) {
      console.error(`Failed to clear localStorage: ${err.message}`);
      return false;
    }
  },

  getAllKeys: () => {
    const keys = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        keys.push(key.replace(PREFIX, ''));
      }
    });
    return keys;
  },

  getSize: () => {
    let size = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        size += localStorage.getItem(key).length;
      }
    });
    return (size / 1024).toFixed(2);
  },
};

export const setUser = (user) => storage.set('user', user);
export const getUser = () => storage.get('user');
export const clearUser = () => storage.remove('user');

export const setToken = (token, expiresInMinutes = 1440) => storage.set('token', token, expiresInMinutes);
export const getToken = () => storage.get('token');
export const clearToken = () => storage.remove('token');

export const setPreferences = (preferences) => storage.set('preferences', preferences);
export const getPreferences = () => storage.get('preferences') || {};

export const logout = () => {
  clearUser();
  clearToken();
};
