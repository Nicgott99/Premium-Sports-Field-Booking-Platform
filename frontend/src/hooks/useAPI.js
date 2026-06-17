import { useState, useCallback } from 'react';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opts.headers
    }
  });
};

export const useAPI = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (fetchOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(url, { ...options, ...fetchOptions });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || json);
      return json.data || json;
    } catch (err) {
      const message = err.message || 'API request failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { data, loading, error, fetch };
};

export const usePost = (url) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      const message = err.message || 'POST request failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { loading, error, post };
};

export const useDelete = (url) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const message = err.message || 'DELETE request failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { loading, error, remove };
};
