/**
 * @file pick-type.type.ts
 * @module @stackra/support/utils/mapped-types
 * @description TS-level `PickType<T, K>` — Nestjs-style property picking.
 */

/**
 * Extract from `T` those properties whose keys are in the union `K`.
 * Alias of TypeScript's built-in `Pick<T, K>` — surfaced here for
 * NestJS-style API consistency.
 *
 * @example
 * ```typescript
 * interface User { id: string; name: string; email: string; }
 * type PublicUser = PickType<User, 'id' | 'name'>; // { id: string; name: string }
 * ```
 */
export type PickType<T, K extends keyof T> = Pick<T, K>;
