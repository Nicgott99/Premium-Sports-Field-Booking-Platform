import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useHover Hook
 * Premium Sports Field Booking Platform
 *
 * A custom React hook to detect if an element is currently being hovered over.
 * 
 * @returns {[React.MutableRefObject, boolean]} - A tuple containing the ref to attach to the element, and the boolean hover state.
 */
const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  useEffect(() => {
    const node = ref.current;
    
    if (node) {
      node.addEventListener('mouseenter', handleMouseEnter);
      node.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [handleMouseEnter, handleMouseLeave]);

  return [ref, isHovered];
};

export default useHover;
