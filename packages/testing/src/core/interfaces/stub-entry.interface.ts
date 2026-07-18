/**
 * @file stub-entry.interface.ts
 * @module @stackra/testing/core
 * @description A stubbed method return value or implementation override.
 */

/**
 * Stubbed behaviour for a single method on an assertable proxy.
 *
 * When set, the proxy invokes the stub instead of the underlying method.
 */
export interface IStubEntry<TArgs extends readonly unknown[] = unknown[], TReturn = unknown> {
  /** Fixed return value (mutually exclusive with `implementation`). */
  readonly returnValue?: TReturn;
  /** Custom implementation invoked with the original arguments. */
  readonly implementation?: (...args: TArgs) => TReturn;
  /** Whether the stub should throw the given value instead of returning. */
  readonly throws?: unknown;
}
