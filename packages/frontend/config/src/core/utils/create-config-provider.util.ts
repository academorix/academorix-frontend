/**
 * @file create-config-provider.util.ts
 * @module @stackra/config/core/utils
 * @description Package-internal helper — builds a `FactoryProvider`
 *   entry for a `registerAs(...)` factory, keyed off the factory's
 *   stamped `.KEY`.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/create-config-factory.util.ts (MIT, © Kamil Myśliwiec)
 */

import type { FactoryProvider, IConfigFactory, IConfigFactoryKeyHost } from "@stackra/contracts";

import { getConfigToken } from "./get-config-token.util";

/**
 * Build a `FactoryProvider` for a config factory produced by
 * `registerAs`.
 *
 * When the factory carries a `.KEY` (stamped by `registerAs`), that
 * KEY is used as the provider's `provide` token. When the factory
 * is un-registered (a bare function passed straight to `load: [...]`),
 * a synthetic UUID-derived token is generated so the provider still
 * has an identity — matches nestjs.
 *
 * The `useFactory` is the factory itself; `inject` is empty because
 * `registerAs` factories take no arguments.
 *
 * @param factory - A factory decorated by `registerAs` (has `.KEY`)
 *   OR a plain callable.
 * @returns A `FactoryProvider` entry ready to hand to `providers:`.
 */
export function createConfigProvider(
  factory: IConfigFactory & Partial<IConfigFactoryKeyHost>,
): FactoryProvider {
  return {
    // `.KEY` present → use it directly; absent → synthesise a unique
    // string token so the provider identity is still stable within
    // the container run.
    provide: factory.KEY ?? getConfigToken(generateSyntheticId()),
    useFactory: factory,
    inject: [],
  };
}

/**
 * Generate a synthetic identifier for an unregistered factory.
 *
 * Prefers `crypto.randomUUID()` when available (Node 19+, all modern
 * browsers) and falls back to `Math.random()` on legacy runtimes.
 * The identifier only needs to be unique within a single container
 * run — collisions across bundles are irrelevant.
 */
function generateSyntheticId(): string {
  // globalThis.crypto is available in Node 19+ AND every modern
  // browser without a polyfill. The check keeps older Node happy.
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  // Fallback — Math.random() is not cryptographically strong, but
  // this identifier is a transient DI-token disambiguator, not a
  // security primitive.
  return `synthetic-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
