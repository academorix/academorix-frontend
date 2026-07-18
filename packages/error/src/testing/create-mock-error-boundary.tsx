/**
 * @file create-mock-error-boundary.tsx
 * @module @stackra/error/testing
 * @description Assertable `ErrorBoundary` wrapper that captures every
 *   error surfaced under its subtree.
 *
 *   Wraps the shipped `ErrorBoundary` with a {@link MockErrorRecorder}
 *   pre-wired to `onError` and the {@link MockFallback} as the default
 *   fallback. Consumers can still pass their own `fallback` /
 *   `resetKeys` / etc.
 */

import type { ReactElement, ReactNode } from "react";

import { ErrorBoundary } from "../react/components/error-boundary/error-boundary.component";
import type {
  ErrorFallbackProps,
  IErrorBoundaryProps,
} from "../react/components/error-boundary/error-boundary-props.interface";
import { MockErrorRecorder } from "./mock-error-recorder";
import { MockFallback } from "./mock-fallback";

/** The mock boundary + its recorder. */
export interface CreateMockErrorBoundaryResult {
  /** The React component to place in the tree. */
  MockErrorBoundary: (props: {
    children?: ReactNode;
    fallback?: IErrorBoundaryProps["fallback"];
    resetKeys?: readonly unknown[];
    onError?: IErrorBoundaryProps["onError"];
    onReset?: IErrorBoundaryProps["onReset"];
  }) => ReactElement;
  /** The recorder for assertions. */
  recorder: MockErrorRecorder;
}

/**
 * Create a mock error boundary + a fresh recorder wired to its
 * `onError`. The rendered component defaults its fallback to the
 * {@link MockFallback} so an error immediately shows up in the DOM as
 * `<div data-testid="mock-fallback">…</div>`.
 *
 * @example
 * ```tsx
 * const { MockErrorBoundary, recorder } = createMockErrorBoundary();
 * render(
 *   <MockErrorBoundary>
 *     <Boom />
 *   </MockErrorBoundary>
 * );
 * expect(recorder.last?.message).toBe('boom');
 * ```
 */
export function createMockErrorBoundary(): CreateMockErrorBoundaryResult {
  const recorder = new MockErrorRecorder();

  const MockErrorBoundary = ({
    children,
    fallback,
    resetKeys,
    onError,
    onReset,
  }: {
    children?: ReactNode;
    fallback?: IErrorBoundaryProps["fallback"];
    resetKeys?: readonly unknown[];
    onError?: IErrorBoundaryProps["onError"];
    onReset?: IErrorBoundaryProps["onReset"];
  }): ReactElement => (
    <ErrorBoundary
      onError={(error, info) => {
        recorder.record(error, info);
        onError?.(error, info);
      }}
      onReset={onReset}
      resetKeys={resetKeys}
      fallback={fallback ?? ((p: ErrorFallbackProps) => <MockFallback {...p} />)}
    >
      {children}
    </ErrorBoundary>
  );

  return { MockErrorBoundary, recorder };
}
