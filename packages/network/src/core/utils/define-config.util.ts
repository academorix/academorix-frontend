/**
 * @file define-config.util.ts
 * @module @stackra/network/core/utils
 * @description DEPRECATION SHIM — kept for one release cycle to give
 *   downstream apps time to migrate away from
 *   `import { defineConfig } from '@stackra/network'` toward
 *   `import { registerAs } from '@stackra/config'`.
 *
 *   Emits a one-time `console.warn` on first call. Removal target: v0.2.
 *
 *   The runtime returns the config object unchanged (typed identity
 *   bound to `NetworkModuleOptions`), so every existing call site
 *   continues to typecheck and behave identically during the
 *   migration window.
 *
 *   The shim implements the identity locally instead of delegating
 *   to `createDefineConfig` from `@stackra/support` — that keeps the
 *   deprecation notice count at exactly one per package on first
 *   call, rather than two (support's `createDefineConfig` also
 *   warns on its own module-load invocation).
 *
 *   See `.kiro/specs/stackra-config-package/PLAN.md` for the full
 *   migration guide.
 */

import type { NetworkModuleOptions } from "../interfaces";

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
 * Type-safe configuration builder for the network module.
 *
 * Identity function bound to {@link NetworkModuleOptions}. Preserves
 * its historical signature for backward compat — pass a config
 * object, receive it back unchanged, with TypeScript enforcing the
 * shape.
 *
 * @deprecated Use `registerAs` from `@stackra/config` instead. This
 *   alias will be removed in v0.2.
 *
 *   ```typescript
 *   // Before
 *   import { defineConfig } from '@stackra/network';
 *   export default defineConfig({ global: true, logging: 'info' });
 *
 *   // After
 *   import { registerAs, env } from '@stackra/config';
 *   export const networkConfig = registerAs<NetworkModuleOptions>('network', () => ({
 *     global: true,
 *     logging: env('NETWORK_LOG_LEVEL', 'info'),
 *   }));
 *   ```
 *
 * @typeParam T - Constrained to `NetworkModuleOptions` so the caller
 *   literal narrows past the interface widening.
 * @param config - Network module configuration object.
 * @returns The same config object, unchanged.
 */
export function defineConfig<T extends NetworkModuleOptions>(config: T): T {
  // Warn-once — a single flag flip so a config file calling
  // `defineConfig(...)` multiple times only logs once per boot.
  if (!warned) {
    // fail-soft — some pre-release toolchains strip `console` in
    // production. Guard the call so the shim never crashes user
    // code even if `console.warn` is unavailable.
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "[@stackra/network] defineConfig is deprecated and will be removed in v0.2. " +
          "Use `registerAs` from `@stackra/config` instead. " +
          "See .kiro/specs/stackra-config-package/PLAN.md for the migration guide.",
      );
    }
    warned = true;
  }
  // Pure identity — preserves the runtime shape callers relied on
  // before the deprecation, without triggering support's separate
  // `createDefineConfig` warning.
  return config;
}

// ════════════════════════════════════════════════════════════════════════════════
// Convenience re-export — consumers migrating a single file can
// `import { registerAs } from '@stackra/network'` for one release
// cycle. Also visible at the package root via `core/index.ts`.
// Removed in v0.2 — consumers should switch to importing from
// `@stackra/config` directly at their own pace.
// ════════════════════════════════════════════════════════════════════════════════

/** @deprecated Import `registerAs` directly from `@stackra/config`. */
export { registerAs } from "@stackra/config";
