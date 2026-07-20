/**
 * @file create-define-config.util.ts
 * @module @stackra/support/utils
 * @description DEPRECATION SHIM — factory that returns a typed
 *   identity function bound to a specific config shape. Was the
 *   engine behind every per-package `defineConfig` alias
 *   (`@stackra/cache`, `@stackra/logger`, `@stackra/network`,
 *   `@stackra/queue`, `@stackra/events`, `@stackra/ssr`, …). Now
 *   deprecated; per-package aliases warn separately on first use.
 *   Removal target: v0.2.
 *
 *   Only the outer `createDefineConfig()` factory call warns —
 *   the returned identity function does NOT emit its own warning.
 *   That's the per-package shim's job (each `@stackra/<pkg>` alias
 *   wraps its own `defineConfig` function with its own warn-once
 *   guard so the message names the right package). Doubling the
 *   warning here would generate two lines of noise for one
 *   deprecated operation.
 *
 *   See `.kiro/specs/stackra-config-package/PLAN.md` for the full
 *   migration guide.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Warn-once module-scope guard
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Module-scope guard that ensures the deprecation notice fires at
 * most once per bundle load. `let` because the flag is mutated on
 * first use — this is the intended side effect of the shim.
 */
let warned = false;

// ════════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Factory that returns a typed identity function for authoring
 * configs of shape `TOptions`. Each invocation returns a NEW
 * function reference so two independently-bound aliases never
 * share reference identity — this matters for callers that key
 * memoisation maps on the helper function itself.
 *
 * The returned identity function does NOT emit its own warning
 * (each per-package `defineConfig` alias built on top of this
 * shim warns once on its own first call).
 *
 * @deprecated Use `registerAs<TOptions>(namespace, factory)` from
 *   `@stackra/config` instead. This factory will be removed in
 *   v0.2. See `.kiro/specs/stackra-config-package/PLAN.md` for the
 *   migration guide.
 *
 * @typeParam TOptions - The config shape the returned function
 *   will accept.
 * @returns A `<U extends TOptions>(config: U) => U` identity
 *   function that preserves the caller literal type at the call
 *   site.
 *
 * @example
 * ```typescript
 * // Before (deprecated):
 * import { createDefineConfig } from '@stackra/support';
 * import type { ICacheModuleConfig } from '@stackra/cache';
 * export const defineConfig = createDefineConfig<ICacheModuleConfig>();
 *
 * // After:
 * import { registerAs, env } from '@stackra/config';
 * import type { ICacheModuleConfig } from '@stackra/cache';
 * export const cacheConfig = registerAs<ICacheModuleConfig>('cache', () => ({
 *   default: env('CACHE_STORE', 'memory'),
 *   ttl: env.number('CACHE_TTL', 3600),
 * }));
 * ```
 */
export function createDefineConfig<TOptions>(): (config: TOptions) => TOptions {
  // Warn-once guard — the deprecation notice fires the first time
  // ANY consumer calls `createDefineConfig(...)`. Downstream
  // packages historically call this at module top-level (once per
  // package import), so this is effectively "warn once per boot".
  if (!warned) {
    // fail-soft — guard against toolchains that strip `console` in
    // production so the shim never crashes user code.
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "[@stackra/support] createDefineConfig is deprecated and will be removed in v0.2. " +
          "Use `registerAs` from `@stackra/config` instead. " +
          "Per-package `defineConfig` aliases built on top of this will also warn once " +
          "on first use during the deprecation window.",
      );
    }
    warned = true;
  }
  // Fresh closure per invocation — two independently-bound aliases
  // never share reference identity. Callers keying memoisation
  // maps on the helper function stay isolated per package.
  return (config: TOptions): TOptions => config;
}
