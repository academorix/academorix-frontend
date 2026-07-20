/**
 * @file logger-config-internal.constant.ts
 * @module @stackra/logger/core/constants
 * @description Package-internal DI token holding the resolved
 *   `ILoggerModuleConfig` value bound by `LoggerModule.forRoot` /
 *   `LoggerModule.forRootAsync`.
 *
 *   This token is **not** exported from the package's public API
 *   barrel. Consumers reach the config through the app-owned
 *   `loggerConfig.KEY` on a `registerAs(...)` factory from
 *   `@stackra/config` (see the "Config factory" section in
 *   `.kiro/steering/package-conventions.md`), never through this
 *   symbol.
 */

/**
 * Package-internal DI token for `LoggerModule`'s resolved config
 * value.
 *
 * Bound by `LoggerModule.forRoot` / `LoggerModule.forRootAsync` and
 * injected only by classes inside `@stackra/logger` — the manager
 * and any future service that needs the merged configuration.
 * Consumers MUST NOT import this token; the canonical way to reach
 * the same config is `@Inject(loggerConfig.KEY)` where
 * `loggerConfig` is an app-owned `registerAs` factory registered via
 * `ConfigModule.forRoot({ load: [loggerConfig] })`.
 *
 * @internal
 */
export const LOGGER_CONFIG_INTERNAL = Symbol("@stackra/logger:config-internal");
