import { useCallback, useRef, useState } from 'react';

/**
 * useFileUpload Hook
 * Premium Sports Field Booking Platform
 *
 * Manages the full lifecycle of a client-side file selection:
 * validation (type, size), preview URL generation, and cleanup.
 * Works with <input type="file">, drag-and-drop, or programmatic selection.
 *
 * @param {object}   [options]
 * @param {string[]} [options.accept]         - Allowed MIME types (e.g. ['image/jpeg', 'image/png']).
 * @param {number}   [options.maxSizeMB=5]    - Maximum allowed file size in megabytes.
 * @param {boolean}  [options.multiple=false] - Allow selecting multiple files.
 *
 * @returns {{
 *   files: File[],
 *   previews: string[],
 *   error: string|null,
 *   inputRef: React.RefObject,
 *   openFilePicker: Function,
 *   handleFiles: Function,
 *   reset: Function,
 * }}
 *
 * @example
 * const { files, previews, inputRef, openFilePicker, error } = useFileUpload({
 *   accept: ['image/jpeg', 'image/png', 'image/webp'],
 *   maxSizeMB: 4,
 * });
 * <button onClick={openFilePicker}>Upload Photo</button>
 * {previews.map(url => <img key={url} src={url} />)}
 */
const useFileUpload = (options = {}) => {
  const { accept = [], maxSizeMB = 5, multiple = false } = options;

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const cleanup = (urls) => urls.forEach((url) => URL.revokeObjectURL(url));

  const validate = useCallback(
    (fileList) => {
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (const file of fileList) {
        if (accept.length > 0 && !accept.includes(file.type)) {
          return `File type "${file.type}" is not allowed. Accepted: ${accept.join(', ')}`;
        }
        if (file.size > maxBytes) {
          return `"${file.name}" exceeds the ${maxSizeMB}MB size limit.`;
        }
      }
      return null;
    },
    [accept, maxSizeMB]
  );

  const handleFiles = useCallback(
    (fileList) => {
      const arr = Array.from(fileList);
      if (!arr.length) return;

      setError(null);
      const validationError = validate(arr);
      if (validationError) {
        setError(validationError);
        return;
      }

      const selected = multiple ? arr : [arr[0]];

      // Revoke old object URLs to prevent memory leaks
      setPreviews((old) => {
        cleanup(old);
        return selected.map((f) => URL.createObjectURL(f));
      });

      setFiles(selected);
    },
    [validate, multiple]
  );

  const openFilePicker = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  }, []);

  const reset = useCallback(() => {
    setPreviews((old) => { cleanup(old); return []; });
    setFiles([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return { files, previews, error, inputRef, openFilePicker, handleFiles, reset };
};

export default useFileUpload;
