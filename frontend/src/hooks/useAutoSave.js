import { useEffect, useRef } from 'react';

export const useAutoSave = (data, onSave, delay = 2000) => {
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(data);

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        try {
          await onSave(data);
          previousDataRef.current = data;
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      }, delay);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [data, onSave, delay]);
};
