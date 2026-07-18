/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file assertable-proxy.ts
 * @module @stackra/testing/core
 * @description Wraps an arbitrary object in a Proxy that records every
 *   method call on an attached `Assertable` bookkeeper. The returned
 *   object is a drop-in replacement for the original with the same type,
 *   plus an `$` property exposing the `Assertable` for assertions.
 *
 *   Usage:
 *   ```ts
 *   const mock = createAssertableProxy(new UserService());
 *   mock.getUser('42');
 *   expect(mock.$.wasCalledWith('getUser', '42')).toBe(true);
 *   ```
 */

import { Assertable } from "./assertable";

/**
 * A proxied object with the same public API as `T`, plus a `$` accessor
 * exposing the `Assertable` bookkeeper for assertions.
 */
export type AssertableProxy<T extends object> = T & { readonly $: Assertable };

/**
 * Symbol used to expose the bookkeeper on the proxy. Consumers use `mock.$`
 * for readability, but the symbol is available for tools that need a
 * collision-proof accessor.
 */
export const ASSERTABLE_SYMBOL = Symbol.for("@stackra/testing/assertable");

/**
 * Wrap an object in an assertable proxy.
 *
 * Every function-typed property becomes a recording forwarder:
 * - If a stub is registered for the method name, the stub's `returnValue`,
 *   `implementation`, or `throws` is used.
 * - Otherwise, the original method is invoked with `this` bound to the
 *   underlying object.
 * - Either way, the call (args + return value or error) is recorded on
 *   the attached `Assertable`.
 *
 * Non-function property reads are forwarded transparently and are not
 * recorded.
 *
 * @typeParam T - Type of the wrapped object
 * @param target - The object to wrap
 * @returns A proxy over `target` with an added `$` accessor
 */
export function createAssertableProxy<T extends object>(target: T): AssertableProxy<T> {
  const assertable = new Assertable();

  const handler: ProxyHandler<T> = {
    get(obj, prop, receiver) {
      // Expose the bookkeeper under both `$` and the well-known symbol
      if (prop === "$" || prop === ASSERTABLE_SYMBOL) {
        return assertable;
      }

      const value = Reflect.get(obj, prop, receiver);
      const method = typeof prop === "string" ? prop : prop.toString();

      // Non-function property reads pass through unchanged
      if (typeof value !== "function") {
        return value;
      }

      // Wrap function with call recording
      return (...args: unknown[]): unknown => {
        const stub = assertable.getStub(method);

        // Stub: throws
        if (stub?.throws !== undefined) {
          try {
            throw stub.throws;
          } finally {
            assertable.record({ method, args, error: stub.throws });
          }
        }

        // Stub: implementation
        if (stub?.implementation) {
          try {
            const returnValue = stub.implementation(...(args as any));
            assertable.record({ method, args, returnValue });
            return returnValue;
          } catch (error) {
            assertable.record({ method, args, error });
            throw error;
          }
        }

        // Stub: return value
        if (stub && "returnValue" in stub) {
          const returnValue = stub.returnValue;
          assertable.record({ method, args, returnValue });
          return returnValue;
        }

        // No stub — forward to original and record the outcome
        try {
          const returnValue = (value as (...args: unknown[]) => unknown).apply(obj, args);
          assertable.record({ method, args, returnValue });
          return returnValue;
        } catch (error) {
          assertable.record({ method, args, error });
          throw error;
        }
      };
    },
  };

  return new Proxy(target, handler) as AssertableProxy<T>;
}
