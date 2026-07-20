/**
 * @file index.ts
 * @module @stackra/error/testing
 * @description Public API for `@stackra/error/testing`.
 *
 *   Small, dependency-free test doubles for the error-boundary system:
 *   - `MockErrorRecorder` — a `.errors` ledger + an `onError` handler
 *     tests wire to any boundary they render.
 *   - `MockFallback` — a bare-bones fallback that renders the caught
 *     error under a stable `data-testid` and records it into the
 *     supplied recorder.
 *   - `createMockErrorBoundary()` — a factory returning an
 *     `<ErrorBoundary>` pre-wired to a fresh recorder + `MockFallback`.
 *
 *   None of these depend on `@stackra/ui`, so they're safe to render
 *   inside a plain vitest + React Testing Library setup.
 *
 * @example
 * ```tsx
 * import { createMockErrorBoundary } from '@stackra/error/testing';
 *
 * const { MockErrorBoundary, recorder } = createMockErrorBoundary();
 * render(<MockErrorBoundary><Boom /></MockErrorBoundary>);
 * expect(recorder.last?.message).toBe('boom');
 * ```
 */

export { MockErrorRecorder, type CapturedError } from "./mock-error-recorder";
export { MockFallback, type MockFallbackProps } from "./mock-fallback";
export {
  createMockErrorBoundary,
  type CreateMockErrorBoundaryResult,
} from "./create-mock-error-boundary";
