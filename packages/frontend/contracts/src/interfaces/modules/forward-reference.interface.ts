/**
 * @file forward-reference.interface.ts
 * @module @stackra/contracts/interfaces/modules
 * @description The `ForwardReference<T>` interface — wraps a lazy
 *   reference to a class that isn't yet defined at import time, used
 *   to break circular dependencies in the container's module graph.
 */

/**
 * A lazy pointer to a not-yet-defined class or module.
 *
 * Consumers wrap a `() => X` thunk via `forwardRef(() => X)` when
 * `X` participates in a circular import; the container unwraps the
 * thunk after every module has been resolved.
 *
 * @typeParam T - The eventual value shape (`Type<T>` or a
 *   `DynamicModule` for module imports).
 */
export interface ForwardReference<T = any> {
  /** Lazy handle — thunk at runtime, typed as `T` for consumer ergonomics. */
  forwardRef: T;
}
