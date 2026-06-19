import { useState, useEffect } from 'react';
export const useScrollPosition = () => {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const handleScroll = () => setPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return position;
};
