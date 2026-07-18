/**
 * @file mock-fallback.tsx
 * @module @stackra/error/testing
 * @description Test-only fallback components for `ErrorBoundary`.
 *
 *   Unlike the shipped HeroUI fallbacks (`DefaultErrorFallback`,
 *   `InlineErrorFallback`), these render bare `<div>`s with predictable
 *   `data-testid` attributes so assertions can rely on them without
 *   pulling in the whole design system.
 */

import type { ReactElement } from "react";

import type { ErrorFallbackProps } from "../react/components/error-boundary/error-boundary-props.interface";
import type { MockErrorRecorder } from "./mock-error-recorder";

/** Props for {@link MockFallback}. */
export interface MockFallbackProps extends ErrorFallbackProps {
  /** Optional recorder — invoked with the captured error on every render. */
  recorder?: MockErrorRecorder;
  /** Testid emitted on the root element. Default: `mock-fallback`. */
  testId?: string;
}

/**
 * A minimal fallback component: renders the error message and (when
 * `reset` is provided) a `<button>` that calls it. Zero design-system
 * dependencies — safe for use inside `@stackra/testing`'s React setup.
 *
 * @example
 * ```tsx
 * const recorder = new MockErrorRecorder();
 * render(
 *   <ErrorBoundary fallback={(p) => <MockFallback {...p} recorder={recorder} />}>
 *     <Boom />
 *   </ErrorBoundary>
 * );
 * expect(screen.getByTestId('mock-fallback')).toBeVisible();
 * expect(recorder.last?.message).toBe('boom');
 * ```
 */
export function MockFallback({
  error,
  reset,
  recorder,
  testId = "mock-fallback",
}: MockFallbackProps): ReactElement {
  recorder?.record(error);
  return (
    <div data-testid={testId} role="alert">
      <span data-testid={`${testId}-message`}>{error.message}</span>
      {reset ? (
        <button type="button" data-testid={`${testId}-reset`} onClick={reset}>
          Reset
        </button>
      ) : null}
    </div>
  );
}
