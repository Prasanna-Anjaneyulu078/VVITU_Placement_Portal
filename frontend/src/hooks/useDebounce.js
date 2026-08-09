import { useState, useEffect } from 'react';

/**
 * useDebounce – delays updating `value` by `delay` ms.
 * Useful for search inputs to avoid firing API calls on every keystroke.
 *
 * @param {*}      value  The value to debounce
 * @param {number} delay  Delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
