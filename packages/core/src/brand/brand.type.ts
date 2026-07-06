/**
 * @file brand.type.ts
 * @module @academorix/core/brand/brand.type
 *
 * @description
 * The workspace's canonical brand-typing (nominal typing via unique
 * symbol) helpers. Consumers use them to build ID types that are
 * structurally strings/numbers but never interchangeable.
 *
 * @example
 * ```ts
 * import type { Brand } from "@academorix/core/brand";
 *
 * export type UserId = Brand<string, "UserId">;
 * export type TenantId = Brand<string, "TenantId">;
 *
 * function assign(user: UserId, tenant: TenantId) { ... }
 *
 * const u = "u_1" as UserId;
 * const t = "t_1" as TenantId;
 *
 * assign(u, t); // ok
 * assign(t, u); // Type error — arguments swapped.
 * ```
 */

/**
 * The internal marker symbol. Using a unique symbol (not just a string
 * literal) means every downstream Brand<T, N> is opaque even to code
 * that knows the name.
 */
declare const brandSymbol: unique symbol;

/**
 * Brands a base type `T` with a nominal tag `Name`.
 *
 * The result is structurally assignable FROM the base type (so plain
 * string literals still work with explicit casts) but not INTERCHANGEABLE
 * across different brands.
 *
 * @typeParam T - The base runtime type (usually `string` or `number`).
 * @typeParam Name - The nominal tag (any string literal).
 */
export type Brand<T, Name extends string> = T & {
  readonly [brandSymbol]: Name;
};

/**
 * Utility that unwraps a Brand back to its base type. Useful when
 * interoping with libraries that don't know about the tag (e.g. a
 * form library expecting a plain string).
 */
export type Unbrand<T> = T extends Brand<infer Base, string> ? Base : T;
