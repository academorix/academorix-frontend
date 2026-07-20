/**
 * @file partial-type.type.ts
 * @module @stackra/support/utils/mapped-types
 * @description TS-level `PartialType<T>` — every field of `T` becomes
 *   optional. Mirrors NestJS's `@nestjs/mapped-types` `PartialType(...)`
 *   at the TYPE level; the class-runtime bits are intentionally dropped
 *   because the Stackra monorepo does not use `class-validator` /
 *   `class-transformer` metadata propagation.
 */

/**
 * Convert every property of `T` into an optional property.
 *
 * @example
 * ```typescript
 * interface User { name: string; age: number; }
 * type UpdateUser = PartialType<User>; // { name?: string; age?: number }
 * ```
 */
export type PartialType<T> = Partial<T>;
