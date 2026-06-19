import { useState } from 'react';
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return [copy, copied];
};
