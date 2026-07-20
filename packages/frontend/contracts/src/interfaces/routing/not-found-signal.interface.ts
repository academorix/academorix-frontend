/**
 * @file not-found-signal.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Control-flow signal shape emitted by the `notFound(...)`
 *   helper. The outer boundary maps this signal to the route's nearest
 *   `NotFoundComponent` slot on the client, or to a 404 output at
 *   build-time prerender.
 */

/**
 * Signal that terminates the current pipeline with a not-found outcome.
 */
export interface INotFoundSignal {
  /** Discriminator — always `'not-found'`. */
  readonly kind: "not-found";

  /** Human-readable reason attached to the signal for diagnostics. */
  readonly reason: string;
}
