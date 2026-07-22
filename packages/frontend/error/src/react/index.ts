/**
 * @file index.ts
 * @module @stackra/error/react
 * @description React bindings for the error system — boundaries, presets,
 *   default HeroUI fallbacks, an imperative escalation hook, and the
 *   `withErrorBoundary` HOC.
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
} from "./components/error-boundary/error-boundary.interface";

export { AppErrorBoundary } from "./components/app-error-boundary/app-error-boundary.component";
export type { IAppErrorBoundaryProps } from "./components/app-error-boundary/app-error-boundary.component";

export { ComponentErrorBoundary } from "./components/component-error-boundary/component-error-boundary.component";
export type { IComponentErrorBoundaryProps } from "./components/component-error-boundary/component-error-boundary.component";

// ============================================================================
// Fallbacks
// ============================================================================
export { DefaultErrorFallback } from "./components/fallbacks/default-error-fallback";
export type { IDefaultErrorFallbackProps } from "./components/fallbacks/default-error-fallback/default-error-fallback.component";

export { InlineErrorFallback } from "./components/fallbacks/inline-error-fallback";
export type { IInlineErrorFallbackProps } from "./components/fallbacks/inline-error-fallback/inline-error-fallback.component";

// ============================================================================
// Context & hooks
// ============================================================================
export { ErrorBoundaryContext } from "./contexts";
export type { ErrorBoundaryContextValue } from "./contexts";
export { useErrorBoundaryContext } from "./hooks/use-error-boundary-context";

export { useErrorBoundary } from "./hooks/use-error-boundary";
export type { UseErrorBoundaryApi } from "./hooks/use-error-boundary/use-error-boundary.hook";

// ============================================================================
// HOC
// ============================================================================
export { withErrorBoundary } from "./components/with-error-boundary";
