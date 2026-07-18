/**
 * @file error-boundary-props.interface.ts
 * @module @stackra/error/react/components
 * @description Props and fallback contract for the base ErrorBoundary.
 */

import type { ErrorInfo, ReactNode } from "react";

/** Why a boundary reset occurred. */
export type ErrorBoundaryResetReason = "imperative" | "keys";

/** Arguments handed to a render-function fallback. */
export interface ErrorFallbackProps {
  /** The caught error. */
  error: Error;

  /** Clear the error and attempt to re-render `children`. */
  reset: () => void;
}

/** A fallback expressed as a render function. */
export type ErrorFallbackRender = (props: ErrorFallbackProps) => ReactNode;

/**
 * Props for the base `ErrorBoundary`.
 */
export interface IErrorBoundaryProps {
  /** The subtree to protect. */
  children: ReactNode;

  /**
   * UI to show once an error is caught. Either static content or a
   * render function receiving the error and a `reset` callback. When
   * omitted, the boundary renders `null` on error.
   */
  fallback?: ReactNode | ErrorFallbackRender;

  /**
   * Called after an error is caught (post-render, safe for side
   * effects). This is the extension point for reporting — logging,
   * analytics, telemetry (Sentry, etc.) all hang off here.
   */
  onError?: (error: Error, info: ErrorInfo) => void;

  /** Called when the boundary resets, before `children` re-mount. */
  onReset?: (details: { reason: ErrorBoundaryResetReason }) => void;

  /**
   * When any entry changes (by `Object.is`) while the boundary is in an
   * error state, the boundary resets automatically. Useful for clearing
   * the error when the route or a key input changes.
   */
  resetKeys?: readonly unknown[];
}
