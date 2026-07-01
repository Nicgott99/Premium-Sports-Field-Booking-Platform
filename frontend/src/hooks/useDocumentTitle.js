import { useEffect } from 'react';

/**
 * useDocumentTitle Hook
 * Premium Sports Field Booking Platform
 *
 * Custom hook to dynamically update the document/page title.
 * Optionally restores the previous title upon unmounting.
 *
 * @param {string} title - The title to set.
 * @param {boolean} [retainOnUnmount=false] - Whether to keep the title when component unmounts.
 */
const useDocumentTitle = (title, retainOnUnmount = false) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      if (!retainOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, retainOnUnmount]);
};

export default useDocumentTitle;
