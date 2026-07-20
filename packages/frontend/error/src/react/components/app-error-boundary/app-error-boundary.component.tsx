/**
 * @file app-error-boundary.component.tsx
 * @module @stackra/error/react/components
 * @description Application-level boundary with a full-page fallback.
 */

import type { ReactNode } from "react";

import { ErrorBoundary } from "../error-boundary/error-boundary.component";
import type { IErrorBoundaryProps } from "../error-boundary/error-boundary-props.interface";
import { DefaultErrorFallback } from "../fallbacks/default-error-fallback.component";

/**
 * Props for {@link AppErrorBoundary}.
 */
export interface IAppErrorBoundaryProps extends Omit<IErrorBoundaryProps, "fallback"> {
  /** Heading text for the fallback. */
  title?: string;

  /** Supporting copy for the fallback. */
  description?: ReactNode;

  /** Show the raw stack trace. Defaults to `false` (avoid in production). */
  showDetails?: boolean;
}

/**
 * Top-level boundary that wraps the whole app (or a large region) and
 * renders the full-page {@link DefaultErrorFallback} on failure. Attach
 * `onError` to report crashes (logging, analytics, telemetry).
 *
 * @example
 * ```tsx
 * import { AppErrorBoundary } from '@stackra/error/react';
 *
 * <AppErrorBoundary onError={report}>
 *   <App />
 * </AppErrorBoundary>;
 * ```
 *
 * @param props - {@link IAppErrorBoundaryProps}.
 * @returns The boundary element.
 */
export function AppErrorBoundary({
  children,
  title,
  description,
  showDetails,
  ...rest
}: IAppErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      {...rest}
      fallback={({ error, reset }) => (
        <DefaultErrorFallback
          error={error}
          reset={reset}
          title={title}
          description={description}
          showDetails={showDetails}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
