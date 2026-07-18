/**
 * @file not-found.signal.ts
 * @module @stackra/routing/middleware/signals
 * @description Control-flow signal + throwing helper for the not-found
 *   outcome.
 *
 *   `NotFoundSignal` extends `Error` so callers can throw it, and
 *   `notFound(reason?)` is the ergonomic thrower helper — `throw
 *   notFound(...)` short-circuits the pipeline into a 404 outcome.
 *   The class and helper live in one file because they are one
 *   conceptual unit.
 *
 *   The `kind: 'not-found'` discriminator matches `INotFoundSignal`
 *   from `@stackra/contracts`.
 */

import type { INotFoundSignal } from "@stackra/contracts";

/**
 * Signal indicating the pipeline should terminate with a not-found
 * outcome. The outer boundary maps this to the nearest
 * `NotFoundComponent` slot on the client, or to a 404 output at
 * build-time prerender.
 */
export class NotFoundSignal extends Error implements INotFoundSignal {
  /** Discriminator — always `'not-found'`. */
  public readonly kind = "not-found" as const;

  /** Human-readable reason attached to the signal. */
  public readonly reason: string;

  /**
   * @param reason - Reason string. Defaults to `'Not Found'`.
   */
  public constructor(reason: string = "Not Found") {
    super(reason);
    this.name = "NotFoundSignal";
    this.reason = reason;
  }
}

/**
 * Terminate the current pipeline with a not-found outcome.
 *
 * @param reason - Reason string. Defaults to `'Not Found'`.
 * @throws {NotFoundSignal} Always — this function never returns.
 *
 * @example
 * ```typescript
 * import { notFound } from '@stackra/routing';
 *
 * export const page = definePage<IBlogPost>({
 *   load: async ({ params }) => {
 *     const post = await fetchPost(params.slug);
 *     if (!post) notFound(`Post '${params.slug}' does not exist`);
 *     return post;
 *   },
 * });
 * ```
 */
export function notFound(reason: string = "Not Found"): never {
  throw new NotFoundSignal(reason);
}
