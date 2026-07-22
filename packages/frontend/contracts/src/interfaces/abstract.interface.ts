/**
 * @file abstract.interface.ts
 * @module @stackra/contracts/interfaces
 * @description The `Abstract<T>` interface — a constructor-less callable
 *   surface that carries a `prototype`. Used everywhere the container
 *   accepts an abstract class token (interfaces + injection tokens).
 */

/**
 * Represents an abstract class — a `Function` whose prototype carries
 * `T` but which cannot itself be `new`-called. Distinguishes an
 * abstract class token from a concrete `Type<T>` at compile time.
 *
 * @typeParam T - The instance shape the abstract class defines.
 */
export interface Abstract<T> extends Function {
  prototype: T;
}
