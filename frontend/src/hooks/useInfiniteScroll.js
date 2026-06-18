import { useEffect, useRef, useState } from 'react';

export const useInfiniteScroll = (callback, options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          setIsLoading(true);
          callback().finally(() => setIsLoading(false));
        }
      },
      { threshold: options.threshold || 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [callback, isLoading, options.threshold]);

  return { observerTarget, isLoading };
};
