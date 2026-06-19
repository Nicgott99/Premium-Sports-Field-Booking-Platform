import { useState, useEffect } from 'react';
export const useIdle = (delay = 5000) => {
  const [isIdle, setIsIdle] = useState(false);
  useEffect(() => {
    let timeout;
    const reset = () => { clearTimeout(timeout); setIsIdle(false); timeout = setTimeout(() => setIsIdle(true), delay); };
    reset();
    window.addEventListener('mousemove', reset);
    window.addEventListener('keypress', reset);
    return () => { clearTimeout(timeout); window.removeEventListener('mousemove', reset); window.removeEventListener('keypress', reset); };
  }, [delay]);
  return isIdle;
};
