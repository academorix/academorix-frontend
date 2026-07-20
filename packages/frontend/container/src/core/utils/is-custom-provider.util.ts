/**
 * isCustomProvider Type Guard
 *
 * Determines whether a provider is a custom provider (has a `provide` property)
 * as opposed to a class shorthand provider (plain class constructor).
 *
 * @module utils/is-custom-provider
 */

import type {
  IProvider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
} from "@stackra/contracts";

/**
 * Check if a provider is a custom provider (has a `provide` property).
 *
 * Custom providers are objects with an explicit `provide` token, as opposed
 * to class shorthand providers which are just class constructors.
 *
 * @param provider - The provider to check
 * @returns `true` if the provider is an object with a `provide` property
 *
 * @example
 * ```typescript
 * isCustomProvider(UserService);                              // false
 * isCustomProvider({ provide: 'TOKEN', useValue: 'hello' });  // true
 * ```
 */
export function isCustomProvider(
  provider: IProvider,
): provider is ClassProvider | ValueProvider | FactoryProvider | ExistingProvider {
  return provider !== null && typeof provider === "object" && "provide" in provider;
}
