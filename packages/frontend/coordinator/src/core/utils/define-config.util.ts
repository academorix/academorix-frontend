/**
 * @file define-config.util.ts
 * @module @stackra/coordinator/core/utils
 * @description Type-safe configuration builder for the coordinator module.
 *   Provides IDE autocompletion and validation for coordinator configurations
 *   defined in separate config files.
 */
/**
 * **Per-module `defineConfig` vs central `registerAs` — which to use?**
 *
 * This helper is a typed identity for **module-level configuration**
 * passed to this package's `forRoot()`. The module merges defaults
 * via its `mergeXConfig()` utility and binds the result under its
 * own contract DI token (e.g. `CACHE_CONFIG`, `LOGGER_CONFIG`, …)
 * which consumers inject directly:
 *
 * ```ts
 * @Injectable()
 * class MyService {
 *   constructor(@Inject(CACHE_CONFIG) private cfg: ICacheModuleConfig) {}
 * }
 * ```
 *
 * For **application-level injectable configuration** — database
 * credentials, mail settings, third-party API keys, business-level
 * settings — use `registerAs(namespace, factory)` from
 * `@stackra/config` instead. `registerAs` returns a factory
 * tagged with a `.KEY` symbol you inject with `@Inject(cfg.KEY)`,
 * and `ConfigModule.forRoot({ load: [...] })` binds it in the
 * central config tree.
 *
 * @see {@link registerAs} from `@stackra/config` for the canonical factory creator.
 * See `.kiro/steering/config-architecture.md` for the full guide.
 */

import type { ICoordinatorModuleOptions } from "@/core/interfaces";

/**
 * Type-safe configuration builder for the coordinator module.
 *
 * @param config - The coordinator module configuration object
 * @returns The same config object, fully typed
 *
 * @example
 * ```typescript
 * // config/coordinator.config.ts
 * import { defineConfig } from '@stackra/coordinator';
 *
 * export default defineConfig({
 *   channelName: 'my-pos-app',
 *   heartbeatMs: 1000,
 *   staleThresholdMs: 3000,
 *   broadcastPatterns: ['sync:**', 'auth:**'],
 * });
 * ```
 */
export function defineConfig(config: ICoordinatorModuleOptions): ICoordinatorModuleOptions {
  return config;
}
