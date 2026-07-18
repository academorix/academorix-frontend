/**
 * @file define-config.util.ts
 * @module @stackra/container/core/utils
 * @description DEPRECATION SHIM — kept for one release cycle to give
 *   downstream apps time to migrate away from
 *   `import { defineConfig } from '@stackra/container'` toward
 *   `import { registerAs } from '@stackra/config'`.
 *
 *   Emits a one-time `console.warn` on first call. Removal target: v0.2.
 *
 *   The container's `defineConfig` is universal — it accepts any
 *   config shape via a generic `<T>(config: T) => T` identity. The
 *   shim preserves that signature so every existing call site
 *   continues to typecheck and behave identically during the
 *   migration window.
 *
 *   `@stackra/container` sits BELOW `@stackra/config` in the workspace
 *   dependency graph (`config` peer-deps `container`), so this shim
 *   deliberately does NOT re-export `registerAs` — that would
 *   introduce a circular peer dependency. Consumers who want the
 *   new spelling import `registerAs` directly from `@stackra/config`.
 *
 *   Unlike the previous implementation (which was a straight
 *   re-export of `defineConfig` from `@stackra/support`), this shim
 *   implements the identity locally so the deprecation notice
 *   names `@stackra/container` rather than support — otherwise a
 *   consumer of `import { defineConfig } from '@stackra/container'`
 *   would see a support-branded warning that doesn't reflect their
 *   actual import path.
 *
 *   See `.kiro/specs/stackra-config-package/PLAN.md` for the full
 *   migration guide.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Warn-once module-scope guard
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Module-scope guard so a config file that calls `defineConfig(...)`
 * many times in one boot still logs exactly one warning per package.
 */
let warned = false;

// ════════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Universal type-safe configuration helper. Preserves the caller's
 * literal type so downstream tooling sees the exact shape rather
 * than a widened `Record<string, unknown>`.
 *
 * @deprecated Use `registerAs` from `@stackra/config` instead. This
 *   alias will be removed in v0.2.
 *
 *   ```typescript
 *   // Before
 *   import { defineConfig } from '@stackra/container';
 *   export default defineConfig<IApplicationOptions>({ port: 3000 });
 *
 *   // After
 *   import { registerAs, env } from '@stackra/config';
 *   export const appConfig = registerAs<IApplicationOptions>('app', () => ({
 *     port: env.number('PORT', 3000),
 *   }));
 *   ```
 *
 * @typeParam T - Inferred from the argument. Explicit annotations
 *   at the call site (`defineConfig<IApplicationOptions>({...})`)
 *   also work.
 * @param config - Any configuration object.
 * @returns The same object, unchanged.
 */
export function defineConfig<T>(config: T): T {
  // Warn-once — a single flag flip so a config file calling
  // `defineConfig(...)` multiple times only logs once per boot.
  if (!warned) {
    // fail-soft — some pre-release toolchains strip `console` in
    // production. Guard the call so the shim never crashes user
    // code even if `console.warn` is unavailable.
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "[@stackra/container] defineConfig is deprecated and will be removed in v0.2. " +
          "Use `registerAs` from `@stackra/config` instead. " +
          "See .kiro/specs/stackra-config-package/PLAN.md for the migration guide.",
      );
    }
    warned = true;
  }
  // Pure identity — preserves the runtime shape callers relied on
  // before the deprecation.
  return config;
}
