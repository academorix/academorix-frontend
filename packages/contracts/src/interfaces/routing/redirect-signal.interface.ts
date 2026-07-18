/**
 * @file redirect-signal.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Control-flow signal shape emitted by the `redirect(...)`
 *   helper. Middleware, guards, and page loaders throw this signal to
 *   short-circuit the pipeline and hand control to the outer boundary,
 *   which converts it to a router navigation (SPA) or `Response`
 *   (build-time prerender).
 *
 *   The concrete class implementing this interface lives in
 *   `@stackra/routing`. Consumers type against the interface so they
 *   never import the runtime class from contracts.
 */

/**
 * Signal that terminates the current pipeline with a redirect.
 *
 * The discriminator field `kind: 'redirect'` allows `instanceof`-free
 * detection at the outer boundary.
 */
export interface IRedirectSignal {
  /** Discriminator — always `'redirect'`. */
  readonly kind: "redirect";

  /** Destination URL — may be absolute or relative to the current origin. */
  readonly url: string;

  /**
   * HTTP status code in the `[300, 308]` range. The routing runtime
   * validates this at signal-construction time; values outside the
   * range throw `TypeError`.
   *
   * @default 302
   */
  readonly status: number;
}
