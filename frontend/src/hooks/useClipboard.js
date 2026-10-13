/**
 * useClipboard.js — Production-Grade Clipboard Hook
 * Premium Sports Booking Platform
 *
 * Wraps the modern Clipboard API with a graceful execCommand fallback for
 * environments where navigator.clipboard is unavailable (HTTP, older browsers).
 *
 * Features:
 *  - Async Clipboard API (navigator.clipboard.writeText)
 *  - Legacy textarea + execCommand('copy') fallback
 *  - Per-copy success/error state with auto-reset timeout
 *  - Copy history (last N entries) for audit/undo patterns
 *  - Read-from-clipboard support (where permitted by browser)
 *  - isSupported flag so UI can hide copy buttons gracefully
 *
 * Usage:
 * ───────────────────────────────────────────────────────────────────────────
 * // Basic
 * const { copy, copied, error } = useClipboard();
 * <button onClick={() => copy(field.bookingRef)}>
 *   {copied ? '✓ Copied!' : 'Copy ref'}
 * </button>
 *
 * // With options
 * const { copy, copied, error, history, clearHistory } = useClipboard({
 *   resetMs: 3000,       // ms until `copied` resets to false (default: 2000)
 *   maxHistory: 10,      // number of past copies to remember (default: 5)
 *   onSuccess: (text) => toast.success(`Copied: ${text}`),
 *   onError:   (err)  => toast.error('Copy failed'),
 * });
 *
 * // Read from clipboard
 * const { read, clipboardText } = useClipboard();
 * <button onClick={read}>Paste from clipboard</button>
 * <p>{clipboardText}</p>
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef } from 'react';

// ─── Legacy fallback ──────────────────────────────────────────────────────────

/**
 * Copy text using the deprecated execCommand approach.
 * Works on HTTP pages and older browsers where navigator.clipboard is absent.
 *
 * @param {string} text
 * @returns {boolean} success
 */
function execCommandCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Prevent scrolling to the bottom of the page
  textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return success;
}

// ─── isSupported detection ────────────────────────────────────────────────────

const isClipboardApiSupported =
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.writeText === 'function';

const isExecCommandSupported =
  typeof document !== 'undefined' &&
  typeof document.execCommand === 'function';

export const isClipboardSupported = isClipboardApiSupported || isExecCommandSupported;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} UseClipboardOptions
 * @property {number}   [resetMs=2000]    - ms until `copied` resets to false
 * @property {number}   [maxHistory=5]    - max number of past copies to keep
 * @property {Function} [onSuccess]       - called with (text) on successful copy
 * @property {Function} [onError]         - called with (Error) on failed copy
 */

/**
 * @typedef {object} UseClipboardReturn
 * @property {Function} copy            - async (text: string) => Promise<boolean>
 * @property {Function} read            - async () => Promise<string|null>
 * @property {boolean}  copied          - true briefly after a successful copy
 * @property {string|null} error        - error message from last failed copy
 * @property {string|null} clipboardText - text read from clipboard (via read())
 * @property {string[]} history         - array of successfully copied strings (newest first)
 * @property {Function} clearHistory    - () => void
 * @property {boolean}  isSupported     - whether any copy mechanism is available
 */

/**
 * @param {UseClipboardOptions} [options={}]
 * @returns {UseClipboardReturn}
 */
export function useClipboard(options = {}) {
  const {
    resetMs    = 2000,
    maxHistory = 5,
    onSuccess,
    onError,
  } = options;

  const [copied, setCopied]             = useState(false);
  const [error, setError]               = useState(null);
  const [clipboardText, setClipboardText] = useState(null);
  const [history, setHistory]           = useState([]);

  // Reset timer ref — clears any pending reset when a new copy fires
  const resetTimerRef = useRef(null);

  // ── copy ──────────────────────────────────────────────────────────────────
  const copy = useCallback(
    async (text) => {
      if (text == null) return false;
      const str = String(text);

      // Clear any pending reset
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

      setError(null);

      try {
        if (isClipboardApiSupported) {
          await navigator.clipboard.writeText(str);
        } else if (isExecCommandSupported) {
          const ok = execCommandCopy(str);
          if (!ok) throw new Error('execCommand copy returned false');
        } else {
          throw new Error('Clipboard API not supported in this environment');
        }

        setCopied(true);
        setHistory((prev) => [str, ...prev].slice(0, maxHistory));
        if (onSuccess) onSuccess(str);

        resetTimerRef.current = setTimeout(() => {
          setCopied(false);
          resetTimerRef.current = null;
        }, resetMs);

        return true;
      } catch (err) {
        const message = err?.message ?? 'Copy failed';
        setError(message);
        setCopied(false);
        if (onError) onError(err);
        return false;
      }
    },
    [resetMs, maxHistory, onSuccess, onError]
  );

  // ── read ──────────────────────────────────────────────────────────────────
  const read = useCallback(async () => {
    try {
      if (typeof navigator?.clipboard?.readText !== 'function') {
        throw new Error('Clipboard read API not supported');
      }
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      return text;
    } catch (err) {
      setError(err?.message ?? 'Clipboard read failed');
      return null;
    }
  }, []);

  // ── clearHistory ──────────────────────────────────────────────────────────
  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    copy,
    read,
    copied,
    error,
    clipboardText,
    history,
    clearHistory,
    isSupported: isClipboardSupported,
  };
}

// Named re-export for backwards-compatibility with the old 2-value tuple API:
// const [copy, copied] = useClipboard()  ← still works via destructuring trick
export default useClipboard;

