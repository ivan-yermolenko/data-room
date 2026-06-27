import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid state changes (e.g. search query input).
 * 
 * @template T Type of the value to debounce.
 * @param value The value to debounce. Note: Non-primitive values (objects/arrays) should be memoized (e.g., using useMemo) before passing to prevent resetting the timer on every render.
 * @param delay The delay in milliseconds to wait before updating the debounced value.
 * @returns The debounced value.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [value, delay]);

  return debouncedValue;
};
