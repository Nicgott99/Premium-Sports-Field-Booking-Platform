import { useState, useEffect, useRef } from 'react';

/**
 * useNetworkStatus Hook
 * Premium Sports Field Booking Platform
 *
 * Monitors the browser's network connection state and exposes connection
 * quality details from the Network Information API (where available).
 * Useful for showing offline banners, degrading gracefully on slow
 * connections, or pausing real-time polls when offline.
 *
 * @returns {{
 *   isOnline: boolean,
 *   isOffline: boolean,
 *   downlink: number|null,       - Mbps estimate (Chrome only)
 *   effectiveType: string|null,  - '4g'|'3g'|'2g'|'slow-2g'|null
 *   rtt: number|null,            - Round-trip time in ms (Chrome only)
 *   since: Date|null,            - When the current status was last set
 * }}
 *
 * @example
 * const { isOnline, effectiveType } = useNetworkStatus();
 * {!isOnline && <OfflineBanner />}
 */
const useNetworkStatus = () => {
  const getInfo = () => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null;

    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      downlink: connection?.downlink ?? null,
      effectiveType: connection?.effectiveType ?? null,
      rtt: connection?.rtt ?? null,
      since: new Date(),
    };
  };

  const [status, setStatus] = useState(getInfo);
  const connectionRef = useRef(null);

  useEffect(() => {
    const update = () => setStatus(getInfo());

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    // Listen for connection quality changes (Chrome/Edge)
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null;

    if (connection) {
      connection.addEventListener('change', update);
      connectionRef.current = connection;
    }

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      connectionRef.current?.removeEventListener('change', update);
    };
  }, []);

  return status;
};

export default useNetworkStatus;
