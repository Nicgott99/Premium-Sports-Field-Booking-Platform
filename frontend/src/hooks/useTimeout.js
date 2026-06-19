import { useEffect, useRef } from 'react';
export const useTimeout = (callback, delay) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = setTimeout(callback, delay);
    return () => clearTimeout(ref.current);
  }, [callback, delay]);
};
