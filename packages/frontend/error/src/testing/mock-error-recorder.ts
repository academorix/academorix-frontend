/**
 * @file mock-error-recorder.ts
 * @module @stackra/error/testing
 * @description In-memory recorder for errors caught by an `ErrorBoundary`.
 *
 *   Not a boundary itself — a small bookkeeper the mock fallback and
 *   the `onError` handler write into. Tests query `.errors` for the
 *   captured errors and `.componentStacks` for the React error-info
 *   payload of each catch.
 */

import type { ErrorInfo } from "react";

/** A single captured error record. */
export interface CapturedError {
  /** The caught error. */
  error: Error;
  /** React error info (component stack), when available. */
  info?: ErrorInfo;
  /** Wall-clock timestamp of capture. */
  capturedAt: number;
}

/**
 * In-memory error recorder — a small bookkeeper for boundary tests.
 *
 * @example
 * ```ts
 * const recorder = new MockErrorRecorder();
 * const onError = recorder.handler; // pass to <ErrorBoundary onError={...} />
 * // ...trigger a throw in a child...
 * expect(recorder.errors).toHaveLength(1);
 * expect(recorder.last?.message).toBe('boom');
 * ```
 */
export class MockErrorRecorder {
  /** Every captured error, in order. */
  public readonly errors: CapturedError[] = [];

  /** Ergonomic accessor for the most recent capture, or `undefined`. */
  public get last(): Error | undefined {
    return this.errors.at(-1)?.error;
  }

  /**
   * `onError` handler ready to pass to an `ErrorBoundary`.
   *
   * ```tsx
   * <ErrorBoundary onError={recorder.handler}>...</ErrorBoundary>
   * ```
   */
  public readonly handler = (error: Error, info: ErrorInfo): void => {
    this.errors.push({ error, info, capturedAt: Date.now() });
  };

  /** Record an error directly (used by the mock fallback). */
  public record(error: Error, info?: ErrorInfo): void {
    this.errors.push({ error, info, capturedAt: Date.now() });
  }

  /** Just the component stacks for every capture, in order. */
  public get componentStacks(): Array<string | null> {
    return this.errors.map((c) => c.info?.componentStack ?? null);
  }

  /** Drop every captured error. */
  public reset(): void {
    this.errors.length = 0;
  }
}
