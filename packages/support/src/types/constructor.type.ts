/**
 * @file constructor.type.ts
 * @module @stackra/support/types
 * @description Generic constructor-shape utility used by every mixin
 *   factory in the package (`Conditionable`, `Macroable`).
 */

/**
 * Constructor-shape utility.
 *
 * Represents any class constructor whose instance is assignable to `T`.
 * Mixin factories accept a `Base: Constructor<T>` and return a subclass
 * that adds mixin behaviour on top of `Base`'s instances.
 *
 * The rest parameter is intentionally typed as `any[]` (not `unknown[]`
 * or `never[]`) — TypeScript's mixin-class check (TS2545) requires an
 * `any[]` rest parameter on the base constructor so the subclass can
 * forward `super(...args)` regardless of the base's real signature.
 *
 * @typeParam T - The instance shape produced by the constructor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- required by TS2545
export type Constructor<T = object> = new (...args: any[]) => T;
