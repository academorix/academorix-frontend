/**
 * @file omit-type.type.ts
 * @module @stackra/support/utils/mapped-types
 * @description TS-level `OmitType<T, K>` — Nestjs-style property omission.
 */

/**
 * Construct a type with the properties of `T` except for those in
 * union `K`. Alias of TypeScript's built-in `Omit<T, K>` — surfaced
 * here for NestJS-style API consistency.
 *
 * @example
 * ```typescript
 * interface User { id: string; password: string; email: string; }
 * type SafeUser = OmitType<User, 'password'>; // { id: string; email: string }
 * ```
 */
export type OmitType<T, K extends keyof T> = Omit<T, K>;
