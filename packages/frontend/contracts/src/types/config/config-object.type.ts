/**
 * @file config-object.type.ts
 * @module @stackra/contracts/types/config
 * @description Canonical shape of a configuration object returned by
 *   a config factory registered via `registerAs`.
 *
 * @derived @nestjs/config@4.0.4 — lib/types/config-object.type.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Canonical shape of any configuration object.
 *
 * A `ConfigObject` is the untyped record produced by a config factory
 * (`registerAs('cache', () => ({ ... }))`). Consumers typically
 * parameterise the factory with a strongly-typed interface
 * (`registerAs<ICacheModuleConfig>('cache', ...)`) — `ConfigObject` is
 * the fallback used by the factory type-parameter default.
 *
 * @publicApi
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConfigObject = Record<string, any>;
