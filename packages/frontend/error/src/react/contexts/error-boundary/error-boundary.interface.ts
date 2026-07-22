/**
 * @file error-boundary.interface.ts
 * @module @stackra/error/react/contexts/error-boundary
 * @description Shape of the value published by
 *   {@link ErrorBoundaryContext} to its fallback subtree.
 */

/**
 * Value published by an `ErrorBoundary` to its fallback subtree.
 */
export interface ErrorBoundaryContextValue {
  /** The error currently caught by the boundary, or `null`. */
  error: Error | null;

  /** Clear the error and re-render `children`. */
  reset: () => void;
}
