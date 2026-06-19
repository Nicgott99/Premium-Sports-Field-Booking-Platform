import { useState } from 'react';
export const useField = (initial = "") => {
  const [value, setValue] = useState(initial);
  return {
    value,
    setValue,
    bind: { value, onChange: e => setValue(e.target.value) },
    reset: () => setValue(initial)
  };
};
