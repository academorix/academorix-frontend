/**
 * @file define-config.util.ts
 * @module @stackra/support/utils
 * @description DEPRECATION SHIM — the untyped `defineConfig<T>(config: T): T`
 *   identity used to be the workspace's canonical config-authoring
 *   helper. It is now a deprecated alias for `registerAs` from
 *   `@stackra/config`. Removal target: v0.2.
 *
 *   The runtime shape is preserved (pure identity: pass the config
 *   object in, get the same reference out) so every downstream
 *   call site continues to typecheck and behave identically during
 *   the migration window. Only the first call emits a
 *   `console.warn` — subsequent calls are silent.
 *
 *   `@stackra/support` sits BELOW `@stackra/config` in the workspace
 *   dependency graph (`config` peer-deps `support`), so this shim
 *   deliberately does NOT re-export `registerAs` — that would
 *   introduce a circular peer dependency between the foundation and
 *   the config package. Consumers who want the new spelling import
 *   `registerAs` directly from `@stackra/config`.
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
 * Untyped identity function used as a config-authoring helper.
 *
 * The runtime returns the argument unchanged; the generic `T`
 * flows through so callers keep narrow inference at the call site.
 *
 * @deprecated Use `registerAs` from `@stackra/config` instead. This
 *   alias will be removed in v0.2. See
 *   `.kiro/specs/stackra-config-package/PLAN.md` for the migration
 *   guide.
 *
 * @typeParam T - Inferred from the argument. Explicit annotations at
 *   the call site (`defineConfig<Foo>({ ... })`) also work.
 * @param config - Any config object.
 * @returns The same object, unchanged.
 *
 * @example
 * ```typescript
 * // Before (deprecated):
 * import { defineConfig } from '@stackra/support';
 * export default defineConfig({ port: 3000 });
 *
 * // After:
 * import { registerAs, env } from '@stackra/config';
 * export const appConfig = registerAs('app', () => ({
 *   port: env.number('PORT', 3000),
 * }));
 * ```
 */
export function defineConfig<T>(config: T): T {
  // Warn-once guard — a single flag flip so callers who invoke
  // `defineConfig(...)` many times in one boot log only once. The
  // first-call check is intentionally cheap so the shim adds no
  // measurable overhead after the initial notice.
  if (!warned) {
    // fail-soft — some pre-release toolchains strip `console` in
    // production bundles. Guard the call so the shim never crashes
    // user code even when `console.warn` is unavailable.
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "[@stackra/support] defineConfig is deprecated and will be removed in v0.2. " +
          "Use `registerAs` from `@stackra/config` instead. " +
          "See .kiro/specs/stackra-config-package/PLAN.md for the migration guide.",
      );
    }
    warned = true;
  }
  // Pure identity — no defaults, no mutation. Preserves the exact
  // runtime shape callers relied on before the deprecation.
  return config;
}
