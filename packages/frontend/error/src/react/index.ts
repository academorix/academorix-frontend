/**
 * @file index.ts
 * @module @stackra/error/react
 * @description React bindings for the error system — boundaries, presets,
 *   default HeroUI fallbacks, an imperative escalation hook, and a HOC.
 */

// ============================================================================
// Boundaries
// ============================================================================
export { ErrorBoundary } from "./components/error-boundary/error-boundary.component";
export type {
  IErrorBoundaryProps,
  ErrorFallbackProps,
  ErrorFallbackRender,
  ErrorBoundaryResetReason,
} from "./components/error-boundary/error-boundary-props.interface";

export { AppErrorBoundary } from "./components/app-error-boundary/app-error-boundary.component";
export type { IAppErrorBoundaryProps } from "./components/app-error-boundary/app-error-boundary.component";

export { ComponentErrorBoundary } from "./components/component-error-boundary/component-error-boundary.component";
export type { IComponentErrorBoundaryProps } from "./components/component-error-boundary/component-error-boundary.component";

// ============================================================================
// Fallbacks
// ============================================================================
export { DefaultErrorFallback } from "./components/fallbacks/default-error-fallback.component";
export type { IDefaultErrorFallbackProps } from "./components/fallbacks/default-error-fallback.component";

export { InlineErrorFallback } from "./components/fallbacks/inline-error-fallback.component";
export type { IInlineErrorFallbackProps } from "./components/fallbacks/inline-error-fallback.component";

// ============================================================================
// Context & hooks
// ============================================================================
export { ErrorBoundaryContext, useErrorBoundaryContext } from "./context/error-boundary-context";
export type { ErrorBoundaryContextValue } from "./context/error-boundary-context";

export { useErrorBoundary } from "./hooks/use-error-boundary/use-error-boundary.hook";
export type { UseErrorBoundaryApi } from "./hooks/use-error-boundary/use-error-boundary.hook";

// ============================================================================
// HOC
// ============================================================================
export { withErrorBoundary } from "./hoc/with-error-boundary";
