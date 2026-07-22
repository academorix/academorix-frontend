/**
 * @file is-value-provider.util.ts
 * isValueProvider Type Guard
 *
 * Determines whether a provider uses `useValue` to bind a token
 * to a pre-existing value with no instantiation.
 *
 * @module utils/is-value-provider
 */

import { IProvider, ValueProvider } from "@stackra/contracts";
import { isCustomProvider } from "./is-custom-provider.util";

/**
 * Check if a provider uses `useValue`.
 *
 * Value providers bind a token to a pre-existing value with no
 * instantiation or dependency resolution.
 *
 * @param provider - The provider to check
 * @returns `true` if the provider has both `provide` and `useValue` properties
 *
 * @example
 * ```typescript
 * isValueProvider({ provide: 'API_URL', useValue: 'https://...' }); // true
 * isValueProvider({ provide: DB, useFactory: () => connect() });    // false
 * ```
 */
export function isValueProvider(provider: IProvider): provider is ValueProvider {
  return isCustomProvider(provider) && "useValue" in provider;
}
