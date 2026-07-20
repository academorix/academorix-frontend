/**
 * @file use-vibration.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Wrapper around `navigator.vibrate`.
 */

import { useCallback, useMemo } from "react";

/**
 * Vibration pattern accepted by `navigator.vibrate`.
 *
 * A single number is a duration in ms; an array alternates
 * on-off-on-off milliseconds.
 */
export type VibrationPattern = number | readonly number[];

/**
 * Value returned by {@link useVibration}.
 */
export interface IUseVibrationResult {
  /** Whether the Vibration API is available in this browser. */
  readonly isSupported: boolean;
  /**
   * Trigger a vibration. Returns `true` when the browser accepted
   * the pattern; `false` otherwise (unsupported / disallowed).
   */
  readonly vibrate: (pattern: VibrationPattern) => boolean;
}

/**
 * Vibration API hook.
 *
 * @example
 * ```tsx
 * import { useVibration } from '@stackra/pwa/react';
 *
 * function ErrorHaptic() {
 *   const { vibrate } = useVibration();
 *   return <button onClick={() => vibrate([100, 30, 100])}>Try again</button>;
 * }
 * ```
 */
export function useVibration(): IUseVibrationResult {
  const isSupported = useMemo(
    () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function",
    [],
  );

  const vibrate = useCallback(
    (pattern: VibrationPattern): boolean => {
      if (!isSupported) return false;
      // `navigator.vibrate` returns `false` when the browser denies
      // (e.g. no user gesture). Coerce to boolean uniformly.
      const arg = typeof pattern === "number" ? pattern : [...pattern];
      return navigator.vibrate(arg);
    },
    [isSupported],
  );

  return { isSupported, vibrate };
}
