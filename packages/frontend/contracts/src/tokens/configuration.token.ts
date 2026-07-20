/**
 * @file configuration.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the internal configuration host record.
 *
 *   The `CONFIGURATION_TOKEN` binding resolves to the merged config
 *   object that `@stackra/config`'s `ConfigService` reads from. It is
 *   an implementation-facing token — application code should not
 *   inject it directly; use `ConfigService` (or the app-owned
 *   `<cfg>.KEY` on a registered factory) instead.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * DI token for the internal configuration host record.
 *
 * `@stackra/config` binds this token to a mutable `Record<string, any>`
 * that aggregates every namespaced factory's output. `ConfigService`
 * reads through it; consumers do not.
 */
export const CONFIGURATION_TOKEN = Symbol("CONFIGURATION_TOKEN");
