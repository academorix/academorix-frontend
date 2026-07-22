/**
 * @file type.interface.ts
 * @module @stackra/contracts/interfaces
 * @description The `Type<T>` interface — a `new`-callable class shape
 *   used everywhere the container expects a class token.
 */

/**
 * Represents a concrete class whose constructor produces a `T`.
 *
 * Distinguishes a concrete class from an abstract one (`Abstract<T>`)
 * at compile time. Most DI APIs (`useClass`, `Providers[]`, `Type[]`)
 * take a `Type<T>` and the container instantiates it directly.
 *
 * @typeParam T - The instance shape the class produces.
 */
export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}
