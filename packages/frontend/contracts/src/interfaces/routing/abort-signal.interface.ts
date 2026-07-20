/**
 * @file abort-signal.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Control-flow signal shape emitted by the `abort(...)`
 *   helper. The outer boundary unwraps the carried `result` and returns
 *   it as the final outcome of the pipeline — downstream middleware,
 *   guards, and loaders are skipped.
 *
 *   Note: this is a middleware short-circuit signal, distinct from the
 *   Web platform's `AbortSignal` (used for fetch cancellation).
 */

/**
 * Signal that terminates the current pipeline with an explicit result.
 */
export interface IAbortSignal {
  /** Discriminator — always `'abort'`. */
  readonly kind: "abort";

  /**
   * Value the outer boundary should resolve to. Type-erased because
   * consumers may abort with anything from an `Response` to a
   * primitive `null`.
   */
  readonly result: unknown;
}
