/**
 * @file error-boundary.component.tsx
 * @module @stackra/error/react/components
 * @description The base React error boundary.
 *
 *   Catches errors thrown during render/commit in its subtree, publishes
 *   the error + a reset handle via `ErrorBoundaryContext`, and renders the
 *   configured fallback. Reporting (logging, analytics, telemetry) is left
 *   to the caller via the `onError` callback — the boundary itself owns no
 *   observability concern.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorBoundaryContext } from "@/react/contexts";
import type {
  ErrorBoundaryResetReason,
  IErrorBoundaryProps,
} from "./error-boundary.interface";

/** Internal boundary state. */
interface IErrorBoundaryState {
  /** The caught error, or `null` while healthy. */
  error: Error | null;
}

/**
 * Base error boundary. Compose it directly for full control, or use the
 * `AppErrorBoundary` / `ComponentErrorBoundary` presets for batteries-
 * included fallbacks.
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from '@stackra/error/react';
 *
 * <ErrorBoundary
 *   onError={(error, info) => report(error, info)}
 *   fallback={({ error, reset }) => (
 *     <button onClick={reset}>Retry — {error.message}</button>
 *   )}
 * >
 *   <Checkout />
 * </ErrorBoundary>;
 * ```
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public override state: IErrorBoundaryState = {
    error: null,
  };

  /**
   * Move the boundary into its error state when a child throws.
   *
   * @param error - The thrown error.
   * @returns The next state.
   */
  public static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { error };
  }

  /**
   * Side-effect phase — hand the error to the caller's `onError`.
   *
   * @param error - The thrown error.
   * @param info - React error info (component stack).
   */
  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  /**
   * Auto-reset when any `resetKeys` entry changes while errored.
   *
   * @param prevProps - The previous props.
   */
  public override componentDidUpdate(prevProps: Readonly<IErrorBoundaryProps>): void {
    if (this.state.error === null) return;
    if (haveKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset("keys");
    }
  }

  /**
   * Clear the error state and re-render `children`.
   *
   * @param reason - What triggered the reset.
   */
  private reset(reason: ErrorBoundaryResetReason): void {
    this.props.onReset?.({ reason });
    this.setState({ error: null });
  }

  /**
   * Render `children`, or the fallback wrapped in `ErrorBoundaryContext`.
   *
   * @returns The rendered subtree.
   */
  public override render(): ReactNode {
    const { error } = this.state;

    if (error === null) {
      return this.props.children;
    }

    const reset = (): void => this.reset("imperative");
    const { fallback } = this.props;
    const rendered =
      typeof fallback === "function" ? fallback({ error, reset }) : (fallback ?? null);

    return (
      <ErrorBoundaryContext.Provider value={{ error, reset }}>
        {rendered}
      </ErrorBoundaryContext.Provider>
    );
  }
}

/**
 * Compare two `resetKeys` arrays by identity of each entry.
 *
 * @param prev - Previous keys.
 * @param next - Next keys.
 * @returns `true` if the arrays differ in length or any entry.
 */
function haveKeysChanged(
  prev: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined,
): boolean {
  if (prev === next) return false;
  if (prev === undefined || next === undefined) return true;
  if (prev.length !== next.length) return true;
  return prev.some((value, index) => !Object.is(value, next[index]));
}
