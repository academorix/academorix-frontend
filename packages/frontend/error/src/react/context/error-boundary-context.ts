/**
 * @file error-boundary-context.ts
 * @module @stackra/error/react/context
 * @description React context exposing the nearest boundary's caught
 *   error and its reset handle to descendants (typically fallbacks).
 */

import { createContext, useContext } from "react";

/**
 * Value published by an `ErrorBoundary` to its fallback subtree.
 */
export interface ErrorBoundaryContextValue {
  /** The error currently caught by the boundary, or `null`. */
  error: Error | null;

  /** Clear the error and re-render `children`. */
  reset: () => void;
}

/**
 * Context populated by `ErrorBoundary` while it is showing a fallback.
 *
 * `null` outside of a boundary's fallback subtree.
 */
export const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

ErrorBoundaryContext.displayName = "ErrorBoundaryContext";

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
