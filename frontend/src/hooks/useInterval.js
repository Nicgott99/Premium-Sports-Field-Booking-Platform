import { useEffect, useRef } from 'react';
export const useInterval = (callback, delay) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = setInterval(callback, delay);
    return () => clearInterval(ref.current);
  }, [callback, delay]);
};
