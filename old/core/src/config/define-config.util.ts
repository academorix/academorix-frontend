/**
 * @file define-config.util.ts
 * @module @academorix/core/config/define-config.util
 *
 * @description
 * Typed passthrough utilities for domain configuration files across the
 * workspace. Ships in `@academorix/core` because every package + app
 * needs the same primitives.
 *
 * Three variants, all zero-runtime:
 *
 *  - {@link defineConfig} — identity function that ties the config
 *    literal to `T` so IDE go-to-definition and autocomplete work at
 *    the call site.
 *
 *  - {@link defineFrozenConfig} — same as above, but `Object.freeze`s
 *    the result so accidental mutation throws at runtime.
 *
 *  - {@link defineNamedConfig} — factory that returns a `defineConfig`
 *    bound to a specific type parameter. Useful when a package wants
 *    to expose a domain-specific `defineFooConfig()` helper without
 *    duplicating the passthrough plumbing.
 *
 * ## When NOT to use these
 *
 * For third-party tool configs (Vite, Next.js, vitest, tailwind, vercel)
 * use the tool's own `defineConfig` — it already ties the literal to
 * the tool's own type. Wrapping it in ours would add nothing and lose
 * the tool's own strictness.
 *
 * For env-var-driven or otherwise externally-sourced configs, use the
 * `env<T>` primitive from `@academorix/core/env` — that one validates
 * runtime input.
 *
 * @example Base passthrough
 * ```ts
 * import { defineConfig } from "@academorix/core/config";
 *
 * interface FeatureFlags {
 *   readonly newAthleteFlow: boolean;
 *   readonly experimentalCharts: boolean;
 * }
 *
 * export const flags = defineConfig<FeatureFlags>({
 *   newAthleteFlow: true,
 *   experimentalCharts: false,
 * });
 * ```
 *
 * @example Frozen variant for runtime-immutable configs
 * ```ts
 * import { defineFrozenConfig } from "@academorix/core/config";
 *
 * export const brandColors = defineFrozenConfig({
 *   accent: "#0EA5E9",
 *   background: "#FFFFFF",
 * });
 * ```
 *
 * @example Domain-specific named helper
 * ```ts
 * // @academorix/analytics/src/define-events.ts
 * import { defineNamedConfig } from "@academorix/core/config";
 *
 * export const defineEvents = defineNamedConfig<Record<string, string>>();
 * ```
 */

/**
 * Typed passthrough. Identity function whose only job is to tie a config
 * literal to `T` so autocomplete, hover, and go-to-definition work at
 * every call site.
 *
 * Zero runtime cost — after minification this compiles to the literal.
 *
 * @typeParam T - The shape the literal must conform to.
 * @param config - The config literal.
 * @returns The same literal, unchanged.
 */
export function defineConfig<T>(config: T): T {
  return config;
}

/**
 * Same as {@link defineConfig} but `Object.freeze`s the result so
 * runtime mutation attempts throw in strict mode. Prefer this when
 * downstream code should never reassign fields (config values consumed
 * by shared state, singleton stores, etc.).
 *
 * @typeParam T - The shape the literal must conform to.
 * @param config - The config literal.
 * @returns The frozen literal.
 */
export function defineFrozenConfig<T>(config: T): Readonly<T> {
  return Object.freeze(config);
}

/**
 * Factory that returns a `defineConfig` pre-bound to `T`. Useful when a
 * package wants a domain-specific helper like `defineEvents` /
 * `defineFlags` / `defineRoutes` without duplicating the identity
 * function.
 *
 * @typeParam T - The shape every downstream literal must conform to.
 *
 * @example
 * ```ts
 * const defineFeatureFlags = defineNamedConfig<Record<string, boolean>>();
 *
 * const flags = defineFeatureFlags({
 *   dashboardV2: true,
 *   attendanceAlerts: false,
 * });
 * ```
 */
export function defineNamedConfig<T>(): (config: T) => T {
  return (config) => config;
}
