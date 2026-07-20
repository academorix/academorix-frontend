/**
 * @file partial-configuration-key.constant.ts
 * @module @stackra/config/core/constants
 * @description Package-internal marker key attached to a
 *   `registerAs(...)` factory to hold the caller-supplied namespace.
 *
 *   Stamped on the factory function by `registerAs` via
 *   `Object.defineProperty` with `enumerable: false`. Read back by
 *   `getRegistrationToken(factory)` when the `ConfigModule` merges
 *   partial configs into the internal host record.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (PARTIAL_CONFIGURATION_KEY) (MIT, © Kamil Myśliwiec)
 */

/**
 * Package-internal symbol used as the property key that stores a
 * registered factory's namespace token.
 *
 * A `Symbol()` (not `Symbol.for(...)`) so no other package can
 * accidentally reach in and rewrite the value — this is a private
 * contract between `registerAs` and `mergeConfigObject` /
 * `getRegistrationToken` inside this package.
 */
export const PARTIAL_CONFIGURATION_KEY = Symbol("PARTIAL_CONFIGURATION_KEY");
