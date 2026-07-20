/**
 * @file with-error-boundary.tsx
 * @module @stackra/error/react/hoc
 * @description HOC that wraps a component in an ErrorBoundary.
 */

import type { ComponentType, ReactNode } from "react";

import { ErrorBoundary } from "../components/error-boundary/error-boundary.component";
import type { IErrorBoundaryProps } from "../components/error-boundary/error-boundary-props.interface";

/**
 * Wrap a component in an `ErrorBoundary` with preset boundary options.
 *
 * @typeParam P - The wrapped component's props.
 * @param Wrapped - The component to protect.
 * @param boundaryProps - Boundary options (everything except `children`).
 * @returns A component with the same props, guarded by a boundary.
 *
 * @example
 * ```tsx
 * const SafeChart = withErrorBoundary(Chart, {
 *   logContext: 'Chart',
 *   fallback: ({ reset }) => <button onClick={reset}>Reload chart</button>,
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Wrapped: ComponentType<P>,
  boundaryProps?: Omit<IErrorBoundaryProps, "children">,
): ComponentType<P> {
  function WithErrorBoundary(props: P): ReactNode {
    return (
      <ErrorBoundary {...boundaryProps}>
        <Wrapped {...props} />
      </ErrorBoundary>
    );
  }

  // `||` (not `??`) so an EMPTY-string `.name` (anonymous arrow
  // functions stored on a symbol, HOCs with a blank displayName)
  // falls through to `'Component'` instead of producing
  // `withErrorBoundary()`.
  const name = Wrapped.displayName || Wrapped.name || "Component";
  WithErrorBoundary.displayName = `withErrorBoundary(${name})`;

  return WithErrorBoundary;
}
