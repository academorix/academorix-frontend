/**
 * @file use-debounce.hook.ts
 * @module @stackra/ui/core/hooks/use-debounce
 * @description Pure React debounce hook. Lives in the `core` folder
 *   because it uses only `useState` + `useEffect` + `setTimeout` —
 *   identical semantics on web (DOM `setTimeout`) and React Native
 *   (JSI `setTimeout`).
 */

"use client";

import { useEffect, useState } from "react";

// ============================================================================
// Hook
// ============================================================================

/**
 * Debounce a value by a specified delay.
 *
 * Returns a value that only updates after `delay` milliseconds have elapsed
 * since the most recent input change. The timer resets on every new value.
 *
 * Useful for search inputs, autocomplete, and any form field where you
 * want to defer expensive work (e.g., API calls) until the user pauses.
 *
 * @typeParam T - The type of the debounced value.
 * @param value - The value to debounce.
 * @param delay - Delay in milliseconds. Defaults to 300ms — a good
 *   trade-off between responsiveness and request-rate reduction for
 *   typical search-as-you-type UIs.
 * @returns The debounced value. Equal to `value` after the delay elapses.
 *
 * @example Search input
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 *
 * @example Window resize listener
 * ```tsx
 * const [width, setWidth] = useState(window.innerWidth);
 * const debouncedWidth = useDebounce(width, 150);
 *
 * useEffect(() => {
 *   recomputeLayout(debouncedWidth);
 * }, [debouncedWidth]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  // Track the most recently committed (debounced) value. Initial value
  // matches the live value so the first render produces a sensible result
  // even before the timer has fired.
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Schedule a commit of the live value into the debounced state. If
    // `value` or `delay` changes before this timer fires, the cleanup
    // function below clears it, effectively resetting the debounce window.
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup cancels any pending commit when the effect re-runs (new
    // value/delay) or when the component unmounts.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
