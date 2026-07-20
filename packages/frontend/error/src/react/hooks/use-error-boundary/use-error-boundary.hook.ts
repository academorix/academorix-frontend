/**
 * @file use-error-boundary.hook.ts
 * @module @stackra/error/react/hooks
 * @description Imperatively escalate an error to the nearest boundary.
 */

import { useCallback, useState } from "react";

import { normalizeError } from "@/core/utils/normalize-error.util";

/**
 * The imperative escalation API returned by {@link useErrorBoundary}.
 */
export interface UseErrorBoundaryApi {
  /**
   * Escalate a value to the nearest `ErrorBoundary`. The value is
   * normalised to an `Error` and re-thrown during the next render, where
   * a boundary can catch it.
   */
  showBoundary: (error: unknown) => void;
}

/**
 * Bridge imperative failures (event handlers, async callbacks, promise
 * rejections) into a React error boundary.
 *
 * React boundaries only catch errors thrown during render — they can't
 * see a rejected `fetch` inside an `onClick`. This hook stores the error
 * and re-throws it on the next render so the surrounding boundary catches
 * it like any render error.
 *
 * @returns {@link UseErrorBoundaryApi} with `showBoundary`.
 *
 * @example
 * ```tsx
 * const { showBoundary } = useErrorBoundary();
 *
 * const onSave = async () => {
 *   try {
 *     await save();
 *   } catch (err) {
 *     showBoundary(err);
 *   }
 * };
 * ```
 */
export function useErrorBoundary(): UseErrorBoundaryApi {
  const [error, setError] = useState<Error | null>(null);

  // Re-throw during render so the nearest boundary catches it.
  if (error !== null) {
    throw error;
  }

  const showBoundary = useCallback((value: unknown): void => {
    setError(normalizeError(value));
  }, []);

  return { showBoundary };
}
