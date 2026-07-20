/**
 * @file configuration-loader.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the `ConfigModule.forRoot({ load: [...] })`
 *   loader provider — the sentinel that triggers the merge of every
 *   namespaced factory into the internal configuration host record.
 *
 *   Bound by `@stackra/config` via `createSeedLoader` (per
 *   `.kiro/steering/module-lifecycle.md`); consumers never inject
 *   this token directly.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * DI token for the `ConfigModule.forRoot` load-time merge sentinel.
 *
 * The container instantiates the associated seed-loader provider
 * during `onApplicationBootstrap`, which merges every namespaced
 * factory's output into the internal configuration host record
 * bound at `CONFIGURATION_TOKEN`.
 */
export const CONFIGURATION_LOADER = Symbol("CONFIGURATION_LOADER");
