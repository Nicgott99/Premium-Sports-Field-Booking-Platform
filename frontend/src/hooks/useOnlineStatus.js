import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export const useNetworkStatus = () => {
  const [speed, setSpeed] = useState(null);

  useEffect(() => {
    if (navigator.connection) {
      const connection = navigator.connection;
      setSpeed(connection.effectiveType);
      
      const handleChange = () => {
        setSpeed(connection.effectiveType);
      };
      
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  return speed;
};
