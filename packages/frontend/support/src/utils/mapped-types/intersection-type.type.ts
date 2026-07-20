/**
 * @file intersection-type.type.ts
 * @module @stackra/support/utils/mapped-types
 * @description TS-level `IntersectionType<T>` — combine two shapes
 *   into their intersection at the type level.
 */

/**
 * Combine shapes `A` and `B` into their intersection.
 *
 * @example
 * ```typescript
 * interface Person { name: string; }
 * interface Employee { department: string; }
 * type PersonEmployee = IntersectionType<Person, Employee>;
 * //  { name: string; department: string }
 * ```
 */
export type IntersectionType<A, B> = A & B;
