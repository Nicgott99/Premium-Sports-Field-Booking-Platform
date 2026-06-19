import { useState } from "react"; export const useToggle = (initial = false) => { const [value, setValue] = useState(initial); return [value, () => setValue(!value)]; };
