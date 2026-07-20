/**
 * @file stackra-handle.constants.ts
 * @module @stackra/routing/core/constants
 * @description Symbol key used to co-locate Stackra-owned route
 *   metadata inside RRv7's `handle` object.
 *
 *   RRv7 exposes a well-known `handle` metadata bag on every match —
 *   the framework reads consumer-facing fields (`breadcrumb`,
 *   `analytics`) directly from `handle`, but stashes private routing
 *   metadata under the `STACKRA_HANDLE` symbol so it never collides
 *   with third-party contributions.
 */

/**
 * Symbol used as the key for the framework's private route metadata
 * bag inside an RRv7 `handle` object.
 *
 * @example
 * ```typescript
 * const stackra = match.handle?.[STACKRA_HANDLE] as IStackraHandle | undefined;
 * ```
 */
export const STACKRA_HANDLE: unique symbol = Symbol("STACKRA_HANDLE");

/** Type alias mirroring the runtime symbol for narrowing purposes. */
export type STACKRA_HANDLE_KEY = typeof STACKRA_HANDLE;
