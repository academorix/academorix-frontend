/**
 * @file define-config.util.ts
 * @module @stackra/config/core/utils
 * @description DEPRECATED alias — re-exports `registerAs` under the
 *   `defineConfig` name for one release cycle.
 *
 *   The per-package `defineConfig` helper duplicated across
 *   `@stackra/{cache,logger,network,queue,events,container,ssr,support}`
 *   is being retired in favour of `registerAs` from `@stackra/config`.
 *   This shim keeps existing call sites compiling while consumers
 *   migrate. Emits a one-time `console.warn` on first call so the
 *   deprecation is visible at runtime.
 *
 *   Stackra-only file (no upstream nestjs origin).
 */

import type { ConfigObject, IConfigFactory, IConfigFactoryKeyHost } from "@stackra/contracts";

import { registerAs } from "./register-as.util";

/**
 * Module-scoped guard so the deprecation warning fires at most once
 * per bundle load. `let` because the value is mutated on first use.
 */
let warned = false;

/**
 * Fire the deprecation notice exactly once. No-op after the first call.
 *
 * Package-internal helper — split out from the exported function so
 * both overloads route through the same guard.
 */
function warnOnce(): void {
  if (warned) return;
  warned = true;
  // `console.warn` (not `throw`) because this is a soft-deprecation —
  // the code still runs; the migration is on the developer's
  // schedule.
  // eslint-disable-next-line no-console
  console.warn(
    "[@stackra/config] `defineConfig` is deprecated — use `registerAs` instead. This alias will be removed in v0.2.",
  );
}

/**
 * Identity overload — pass a plain config object, get it back.
 *
 * @deprecated Use {@link registerAs} instead. Will be removed in v0.2.
 * @param config - Plain config object.
 * @returns The same object, unchanged.
 */
export function defineConfig<T>(config: T): T;
/**
 * Tagged overload — wraps {@link registerAs} with the same signature.
 *
 * @deprecated Use {@link registerAs} directly instead. Will be removed
 *   in v0.2.
 * @param token - String or symbol namespace.
 * @param configFactory - Factory returning the config object.
 * @returns The factory decorated with `.KEY` + `.asProvider()`.
 */
export function defineConfig<
  TConfig extends ConfigObject,
  TFactory extends IConfigFactory<TConfig> = IConfigFactory<TConfig>,
>(
  token: string | symbol,
  configFactory: TFactory,
): TFactory & IConfigFactoryKeyHost<Awaited<ReturnType<TFactory>>>;
export function defineConfig(configOrToken: unknown, configFactory?: IConfigFactory): unknown {
  warnOnce();
  // Two-argument form — treat as `registerAs(token, factory)`.
  if (
    (typeof configOrToken === "string" || typeof configOrToken === "symbol") &&
    typeof configFactory === "function"
  ) {
    // Cast into the more-specific `IConfigFactory<ConfigObject>` shape —
    // the runtime accepts any factory; the type widening here is a
    // deliberate erasure to hand to `registerAs`.
    return registerAs(configOrToken, configFactory as IConfigFactory<ConfigObject>);
  }
  // Single-argument form — identity, matches the old per-package shim.
  return configOrToken;
}

/**
 * Re-export for consumers who want the new spelling directly.
 * Preserves the `registerAs` binding under this file for tree-shaking.
 */
export { registerAs };
