/**
 * @file define-config.util.ts
 * @module @stackra/scheduler/core/utils
 * @description Type-safe configuration builder for the scheduler module.
 *   Provides IDE autocompletion and validation for scheduler configurations
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

import type { ISchedulerModuleOptions } from '@/core/interfaces/scheduler-module-options.interface';

/**
 * Type-safe configuration builder for the scheduler module.
 *
 * @param config - The scheduler module configuration object
 * @returns The same config object, fully typed
 *
 * @example
 * ```typescript
 * // config/scheduler.config.ts
 * import { defineConfig } from '@stackra/scheduler';
 *
 * export default defineConfig({
 *   tasks: [
 *     { name: 'heartbeat', fn: async () => api.ping(), options: { interval: 30000 } },
 *   ],
 * });
 * ```
 */
export function defineConfig(config: ISchedulerModuleOptions): ISchedulerModuleOptions {
  return config;
}
