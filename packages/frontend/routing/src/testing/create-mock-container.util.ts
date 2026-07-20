/**
 * @file create-mock-container.util.ts
 * @module @stackra/routing/testing
 * @description Test-only mock DI container.
 *
 *   Guard and middleware unit tests need a lightweight
 *   `IApplication` implementation without spinning up the full
 *   `ApplicationFactory`. The mock stores providers in a `Map` and
 *   returns them via `get(...)`.
 */

import type { IApplication } from "@stackra/contracts";

/**
 * A mock DI container for unit tests.
 */
export interface IMockContainer extends IApplication {
  /** Register a provider under a token. */
  set<T>(token: unknown, value: T): IMockContainer;
}

/**
 * Create a mock DI container for unit tests.
 *
 * @param initial - Optional map of pre-registered providers keyed by
 *   their DI token.
 * @returns Mock container implementing `IApplication`.
 *
 * @example
 * ```typescript
 * import { createMockContainer } from '@stackra/routing/testing';
 * import { AUTH_SERVICE } from '@stackra/contracts';
 *
 * const container = createMockContainer([[AUTH_SERVICE, fakeAuth]]);
 * ```
 */
export function createMockContainer(
  initial?: readonly (readonly [unknown, unknown])[],
): IMockContainer {
  // Internal storage keyed by the DI token. A regular `Map` (not
  // `WeakMap`) so symbol tokens are supported and provider identities
  // stay traceable during tests.
  const providers = new Map<unknown, unknown>();
  if (initial) {
    for (const [token, value] of initial) {
      providers.set(token, value);
    }
  }

  const container: IMockContainer = {
    get<T = unknown>(token: unknown): T {
      const value = providers.get(token);
      if (value === undefined) {
        // Throwing on miss mirrors the real container's behaviour so
        // tests catch the same kind of misconfiguration.
        throw new Error(`[MockContainer] No provider registered for token ${String(token)}.`);
      }
      return value as T;
    },
    getOptional<T = unknown>(token: unknown): T | undefined {
      return providers.get(token) as T | undefined;
    },
    has(token: unknown): boolean {
      return providers.has(token);
    },
    set<T>(token: unknown, value: T): IMockContainer {
      providers.set(token, value);
      return container;
    },
  };

  return container;
}
