/**
 * @file define-config.util.ts
 * @module @stackra/routing/core/utils
 * @description DEPRECATION SHIM — kept for one release cycle to give
 *   downstream apps time to migrate away from
 *   `import { defineConfig } from '@stackra/routing'` toward
 *   `import { registerAs } from '@stackra/config'`.
 *
 *   Emits a one-time `console.warn` on first call. Removal target: v0.2.
 *
 *   The runtime returns the config object unchanged (typed identity
 *   bound to `IRoutingModuleOptions`), so every existing call site
 *   continues to typecheck and behave identically during the
 *   migration window.
 *
 *   See `.kiro/specs/stackra-config-package/PLAN.md` for the full
 *   migration guide.
 */

import type { IRoutingModuleOptions } from "@stackra/contracts";

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
 * Typed identity for a routing module configuration.
 *
 * Preserves its historical signature for backward compat — pass a
 * config object, receive it back unchanged, with TypeScript
 * enforcing the shape.
 *
 * @deprecated Use `registerAs` from `@stackra/config` instead. This
 *   alias will be removed in v0.2.
 *
 *   ```typescript
 *   // Before
 *   import { defineConfig } from '@stackra/routing';
 *   export const routingConfig = defineConfig({ basename: '/' });
 *
 *   // After
 *   import { registerAs } from '@stackra/config';
 *   import type { IRoutingModuleOptions } from '@stackra/contracts';
 *
 *   export const routingConfig = registerAs<IRoutingModuleOptions>('routing', () => ({
 *     basename: '/',
 *   }));
 *   ```
 *
 * @param config - Routing module options.
 * @returns The same object, typed as `IRoutingModuleOptions`.
 */
export function defineConfig(config: IRoutingModuleOptions): IRoutingModuleOptions {
  // Warn-once — a single flag flip so a config file calling
  // `defineConfig(...)` multiple times only logs once per boot.
  if (!warned) {
    // fail-soft — some pre-release toolchains strip `console` in
    // production. Guard the call so the shim never crashes user
    // code even if `console.warn` is unavailable.
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "[@stackra/routing] defineConfig is deprecated and will be removed in v0.2. " +
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
