/**
 * @file partial-configuration-propname.constant.ts
 * @module @stackra/config/core/constants
 * @description Property key under which a `registerAs(...)` factory
 *   exposes its DI token (`.KEY`).
 *
 *   Nestjs uses the string literal `'KEY'` here — we preserve that
 *   verbatim so consumers can spell the field in their type signatures
 *   (`cfg.KEY`) without importing a symbol. Stamped by `registerAs`
 *   via `Object.defineProperty`.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (PARTIAL_CONFIGURATION_PROPNAME) (MIT, © Kamil Myśliwiec)
 */

/**
 * String property name under which a `registerAs(...)` factory exposes
 * its DI token.
 *
 * Consumers reach the token as `factory.KEY`; TypeScript sees this via
 * the `IConfigFactoryKeyHost.KEY` field. Kept as a plain string (not a
 * symbol) so it remains ergonomic to type at the call site.
 */
export const PARTIAL_CONFIGURATION_PROPNAME = "KEY" as const;
