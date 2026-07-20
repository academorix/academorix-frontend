/**
 * @file define-routing-config.util.ts
 * @module @stackra/routing/core/utils
 * @description DEPRECATION SHIM — name-disambiguated alias for
 *   `defineConfig(...)` per PLAN v3.9.3, now on the v0.2 removal
 *   path.
 *
 *   Kept for one release cycle to give downstream apps time to
 *   migrate away from
 *   `import { defineRoutingConfig } from '@stackra/routing'` toward
 *   `import { registerAs } from '@stackra/config'`.
 *
 *   Emits a one-time `console.warn` on first call. Removal target: v0.2.
 *
 *   Implements the identity locally (rather than delegating to
 *   `defineConfig` from `./define-config.util`) so calling
 *   `defineRoutingConfig(...)` produces exactly one deprecation
 *   notice, not two.
 */

import type { IRoutingModuleOptions } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Warn-once module-scope guard
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Module-scope guard so a config file that calls
 * `defineRoutingConfig(...)` many times in one boot still logs
 * exactly one warning per package. Independent from
 * `defineConfig`'s own `warned` flag — two aliases, two separate
 * one-shot notices, matching the per-package deprecation shims.
 */
let warned = false;

// ════════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Name-disambiguated typed identity for a routing module
 * configuration.
 *
 * @deprecated Use `registerAs` from `@stackra/config` instead. This
 *   alias will be removed in v0.2.
 *
 *   ```typescript
 *   // Before
 *   import { defineRoutingConfig } from '@stackra/routing';
 *   export const routingConfig = defineRoutingConfig({ basename: '/' });
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
export function defineRoutingConfig(config: IRoutingModuleOptions): IRoutingModuleOptions {
  // Warn-once — a single flag flip so a config file calling
  // `defineRoutingConfig(...)` multiple times only logs once per
  // boot.
  if (!warned) {
    // fail-soft — some pre-release toolchains strip `console` in
    // production. Guard the call so the shim never crashes user
    // code even if `console.warn` is unavailable.
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "[@stackra/routing] defineRoutingConfig is deprecated and will be removed in v0.2. " +
          "Use `registerAs` from `@stackra/config` instead. " +
          "See .kiro/specs/stackra-config-package/PLAN.md for the migration guide.",
      );
    }
    warned = true;
  }
  // Pure identity — preserves the runtime shape callers relied on
  // before the deprecation. Not delegating to `defineConfig` here
  // avoids a double warning (that helper has its own guard).
  return config;
}
