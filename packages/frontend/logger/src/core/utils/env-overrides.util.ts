/**
 * @file env-overrides.util.ts
 * @module @stackra/logger/core/utils
 * @description Environment-variable overrides for `ILoggerModuleConfig`.
 *
 *   These helpers used to be called from a top-level `mergeConfig`
 *   util; the util was removed in the `@stackra/config` migration
 *   and this normalization step now lives inside
 *   `LoggerManager.normalize()` (per `.kiro/steering/package-conventions.md`
 *   — Case B, "normalisation moves into the manager"). The helpers
 *   remain as pure functions here so the manager can compose them,
 *   but they are NOT re-exported from the package's public barrel.
 *
 * @internal
 */

import { LogLevel } from "@stackra/contracts";
import type { ILoggerModuleConfig } from "@stackra/contracts";
import { Env, Str } from "@stackra/support";

/**
 * Read an environment variable (works in Node and Vite).
 *
 * Routes through `@stackra/support`'s `Env` so the same three-source
 * lookup (`process.env` → `import.meta.env` → `globalThis.__ENV__`)
 * applies here per `.kiro/steering/support-utilities.md`. The
 * signature stays `string | undefined` for backwards compatibility
 * with the truthy checks in the callers below — `Env.get` returns
 * `""` on a miss, which we normalise back to `undefined`.
 *
 * @param name - Variable name to look up.
 * @returns The value string, or `undefined` when the variable is
 *   unset or resolves to the empty string.
 * @internal
 */
export function getEnvVar(name: string): string | undefined {
  const value = Env.get(name, "");
  return value === "" ? undefined : value;
}

/**
 * Resolve a raw env-var string to a `LogLevel` enum value.
 *
 * @param value - Raw env-var value (case-insensitive).
 * @returns The matching `LogLevel`, or `undefined` when the string
 *   is not a known level name.
 * @internal
 */
export function resolveLogLevel(value: string): LogLevel | undefined {
  // Route through `Str.lower` per `.kiro/steering/support-utilities.md`
  // instead of a bare `.toLowerCase()`.
  const lower = Str.lower(value);
  return Object.values(LogLevel).find((l) => l === lower) as LogLevel | undefined;
}

/**
 * Apply the `LOG_LEVEL` env-var override to `config.level`.
 *
 * When `LOG_LEVEL` is set to a recognised level name, the returned
 * config carries that level. Otherwise the config is returned as-is.
 *
 * @param config - The logger config being normalised.
 * @returns A new `ILoggerModuleConfig` with `LOG_LEVEL` applied
 *   (identity when the env var is unset or invalid).
 * @internal
 */
export function applyEnvVarOverrides(config: ILoggerModuleConfig): ILoggerModuleConfig {
  const envLevel = getEnvVar("LOG_LEVEL");
  if (envLevel) {
    const resolved = resolveLogLevel(envLevel);
    if (resolved) {
      // Clone rather than mutate — the caller may hold a reference
      // to the raw config in another provider binding.
      return { ...config, level: resolved };
    }
  }
  return config;
}

/**
 * Apply the `APP_DEBUG` env-var override (forces `LogLevel.DEBUG`)
 * and then chain `applyEnvVarOverrides` for `LOG_LEVEL`.
 *
 * `APP_DEBUG=true` / `APP_DEBUG=1` both trigger. Order matters —
 * `APP_DEBUG` is applied first so an explicit `LOG_LEVEL` can still
 * narrow the level afterwards.
 *
 * @param config - The logger config being normalised.
 * @returns A new `ILoggerModuleConfig` with both env overrides
 *   applied.
 * @internal
 */
export function applyEnvironmentOverrides(config: ILoggerModuleConfig): ILoggerModuleConfig {
  const debug = getEnvVar("APP_DEBUG");
  let next = config;
  if (debug === "true" || debug === "1") {
    next = { ...next, level: LogLevel.DEBUG };
  }
  // Chain LOG_LEVEL last so it can override APP_DEBUG when both
  // are present — matches the pre-migration mergeConfig order.
  return applyEnvVarOverrides(next);
}
