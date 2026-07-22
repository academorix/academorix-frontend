/**
 * @file is-factory-provider.util.ts
 * isFactoryProvider Type Guard
 *
 * Determines whether a provider uses `useFactory` to bind a token
 * to a factory function that produces the value.
 *
 * @module utils/is-factory-provider
 */

import { IProvider, FactoryProvider } from "@stackra/contracts";
import { isCustomProvider } from "./is-custom-provider.util";

/**
 * Check if a provider uses `useFactory`.
 *
 * Factory providers bind a token to a factory function that produces
 * the value, optionally with injected dependencies.
 *
 * @param provider - The provider to check
 * @returns `true` if the provider has `provide` and a callable `useFactory`
 *
 * @example
 * ```typescript
 * isFactoryProvider({ provide: DB, useFactory: () => connect() });    // true
 * isFactoryProvider({ provide: DB, useClass: DatabaseService });      // false
 * ```
 */
export function isFactoryProvider(provider: IProvider): provider is FactoryProvider {
  return (
    isCustomProvider(provider) &&
    "useFactory" in provider &&
    typeof (provider as unknown as Record<string, unknown>).useFactory === "function"
  );
}
