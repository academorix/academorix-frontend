/**
 * @file optional-factory-dependency.type.ts
 * @module @stackra/contracts/types
 * @description Wrapper for factory `inject:` entries that should resolve
 *   to `undefined` instead of throwing when the token isn't registered.
 */

import type { InjectionToken } from "./injection-token.type";

/**
 * @publicApi
 */
export type OptionalFactoryDependency = {
  token: InjectionToken;
  optional: boolean;
};
