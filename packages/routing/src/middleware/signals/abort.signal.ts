/**
 * @file abort.signal.ts
 * @module @stackra/routing/middleware/signals
 * @description Control-flow signal + throwing helper for the abort
 *   outcome.
 *
 *   `MiddlewareAbortSignal` extends `Error` so callers can throw it,
 *   and `abort(result)` is the ergonomic thrower helper — `throw
 *   abort(...)` short-circuits the pipeline with a pre-computed
 *   result. The class and helper live in one file because they are
 *   one conceptual unit.
 *
 *   Distinct from the Web platform's `AbortSignal` (used for fetch
 *   cancellation) — the name is deliberately reused for API symmetry,
 *   but the two never interoperate.
 */

import type { IAbortSignal } from "@stackra/contracts";

/**
 * Signal indicating the pipeline should terminate immediately with the
 * provided result. Downstream middleware / guards / loaders are
 * skipped.
 */
export class MiddlewareAbortSignal extends Error implements IAbortSignal {
  /** Discriminator — always `'abort'`. */
  public readonly kind = "abort" as const;

  /** Value the outer boundary should resolve to. */
  public readonly result: unknown;

  /**
   * @param result - The value to short-circuit the pipeline with.
   */
  public constructor(result: unknown) {
    super("Middleware chain aborted");
    this.name = "MiddlewareAbortSignal";
    this.result = result;
  }
}

/**
 * Terminate the current pipeline and return `result` as the final
 * outcome. Downstream middleware / guards / loaders are skipped.
 *
 * @param result - Value the pipeline should resolve to.
 * @throws {MiddlewareAbortSignal} Always — this function never returns.
 *
 * @example
 * ```typescript
 * import { abort } from '@stackra/routing';
 *
 * // Short-circuit with a pre-computed cached response.
 * abort(cachedResponse);
 * ```
 */
export function abort(result: unknown): never {
  throw new MiddlewareAbortSignal(result);
}
