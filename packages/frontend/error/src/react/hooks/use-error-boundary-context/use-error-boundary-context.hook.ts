/**
 * @file use-error-boundary-context.hook.ts
 * @module @stackra/error/react/hooks/use-error-boundary-context
 * @description Read the nearest `<ErrorBoundary>`'s caught error and
 *   its reset handle from React context.
 */

import { useContext } from "react";

import { ErrorBoundaryContext } from "../../contexts/error-boundary";
import type { ErrorBoundaryContextValue } from "../../contexts/error-boundary";

/**
 * Read the nearest boundary's error + reset handle.
 *
 * Intended for custom fallback components that need to trigger a reset
 * without threading the `reset` prop manually.
 *
 * @throws If called outside an `ErrorBoundary` fallback subtree.
 * @returns The current {@link ErrorBoundaryContextValue}.
 */
export function useErrorBoundaryContext(): ErrorBoundaryContextValue {
  const value = useContext(ErrorBoundaryContext);
  if (value === null) {
    throw new Error(
      "useErrorBoundaryContext must be used within an <ErrorBoundary> fallback subtree.",
    );
  }
  return value;
}
