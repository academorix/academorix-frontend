/**
 * @file queue-config-internal.constant.ts
 * @module @stackra/queue/core/constants
 * @description Package-internal DI token holding the resolved
 *   `IQueueModuleOptions` value bound by `QueueModule.forRoot` /
 *   `QueueModule.forRootAsync`.
 *
 *   This token is **not** exported from the package's public API
 *   barrel. Consumers reach the config through the app-owned
 *   `queueConfig.KEY` on a `registerAs(...)` factory from
 *   `@stackra/config` (see the "Config factory" section in
 *   `.kiro/steering/package-conventions.md`), never through this
 *   symbol.
 */

/**
 * Package-internal DI token for `QueueModule`'s resolved config
 * value.
 *
 * Bound by `QueueModule.forRoot` / `QueueModule.forRootAsync` and
 * injected only by classes inside `@stackra/queue` — the manager
 * and any future service that needs the merged configuration.
 * Consumers MUST NOT import this token; the canonical way to reach
 * the same config is `@Inject(queueConfig.KEY)` where `queueConfig`
 * is an app-owned `registerAs` factory registered via
 * `ConfigModule.forRoot({ load: [queueConfig] })`.
 *
 * @internal
 */
export const QUEUE_CONFIG_INTERNAL = Symbol("@stackra/queue:config-internal");
