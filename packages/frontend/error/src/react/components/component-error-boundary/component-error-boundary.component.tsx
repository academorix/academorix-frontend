/**
 * @file component-error-boundary.component.tsx
 * @module @stackra/error/react/components
 * @description Component-level boundary with a compact inline fallback.
 */

import type { ReactNode } from "react";

import { ErrorBoundary } from "../error-boundary/error-boundary.component";
import type { IErrorBoundaryProps } from "../error-boundary/error-boundary-props.interface";
import { InlineErrorFallback } from "../fallbacks/inline-error-fallback.component";

/**
 * Props for {@link ComponentErrorBoundary}.
 */
export interface IComponentErrorBoundaryProps extends Omit<IErrorBoundaryProps, "fallback"> {
  /** Short label describing the failed section. */
  label?: string;
}

/**
 * Fine-grained boundary for a single widget or section. Renders the
 * compact {@link InlineErrorFallback} so a localized failure doesn't take
 * down the surrounding page. Attach `onError` to report failures.
 *
 * @example
 * ```tsx
 * import { ComponentErrorBoundary } from '@stackra/error/react';
 *
 * <ComponentErrorBoundary label="Activity feed unavailable.">
 *   <ActivityFeed />
 * </ComponentErrorBoundary>;
 * ```
 *
 * @param props - {@link IComponentErrorBoundaryProps}.
 * @returns The boundary element.
 */
export function ComponentErrorBoundary({
  children,
  label,
  ...rest
}: IComponentErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      {...rest}
      fallback={({ error, reset }) => (
        <InlineErrorFallback error={error} reset={reset} label={label} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
