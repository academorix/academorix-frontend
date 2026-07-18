/**
 * @file logger.module.ts
 * @module @stackra/logger/core
 * @description DI module for the logger system.
 *
 *   Registers `LoggerManager`, built-in reporters, enrichers, and
 *   configuration. Uses auto-discovery via the `@Reporter` decorator —
 *   reporters are found and registered automatically by the
 *   `ReporterLoader` on module init via the platform-agnostic
 *   `DISCOVERY_SERVICE` (from `@stackra/contracts`).
 *
 *   The resolved config is bound under `LOGGER_CONFIG_INTERNAL`, a
 *   package-private symbol that only classes inside `@stackra/logger`
 *   inject. Consumers who want to read the same config value do so
 *   via `@Inject(loggerConfig.KEY)` on the app-owned `registerAs`
 *   factory — never through this token. Env-var overrides
 *   (`LOG_LEVEL`, `APP_DEBUG`) are applied inside
 *   `LoggerManager.normalize()`.
 */

import { Module, type DynamicModule } from "@stackra/container";
import {
  LOGGER_MANAGER,
  type IConfigModuleAsyncOptions,
  type ILoggerModuleConfig,
} from "@stackra/contracts";

import { LOGGER_CONFIG_INTERNAL } from "./constants/logger-config-internal.constant";
import { LoggerManager } from "./services/logger-manager.service";
import { ContextRepository } from "./services/context-repository.service";
import { ReporterLoader } from "./services/reporter-loader.service";
import { LoggerShutdownService } from "./services/logger-shutdown.service";
import { ConsoleReporter } from "./reporters/console.reporter";
import { JsonReporter } from "./reporters/json.reporter";
import { SilentReporter } from "./reporters/silent.reporter";
import { RedactionEnricher } from "./enrichers/redaction.enricher";
import { InterpolationEnricher } from "./enrichers/interpolation.enricher";
import { ContextEnricher } from "./enrichers/context.enricher";

/**
 * Logger DI module.
 *
 * Provides the `LoggerManager` singleton, built-in reporters
 * (console, json, silent), the enrichment pipeline (interpolation,
 * context, redaction, sampling), the `ContextRepository`, and the
 * logger configuration.
 *
 * @example
 * ```typescript
 * // Preferred — `@stackra/config` factory + `forRootAsync`:
 * import { registerAs, env } from '@stackra/config';
 * import { LoggerModule } from '@stackra/logger';
 *
 * const loggerConfig = registerAs('logger', () => ({
 *   default: 'app',
 *   channels: {
 *     app: { level: env('LOG_LEVEL', 'debug'), reporters: ['console'] },
 *     audit: { level: 'info', reporters: ['json'] },
 *   },
 *   redact: { paths: ['password', 'token'] },
 * }));
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [loggerConfig] }),
 *     LoggerModule.forRootAsync(loggerConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class LoggerModule {
  /**
   * Register the logger module globally with a fully-formed config.
   *
   * Prefer `forRootAsync(loggerConfig.asProvider())` in app code —
   * this synchronous form is kept as an escape hatch for tests
   * and inline configs.
   *
   * @param config - The fully-formed logger module configuration.
   * @returns A `DynamicModule` binding the manager, reporters,
   *   enrichers, and the discovery loader.
   * @throws Error when `config` is `undefined` / `null`. Defaults
   *   now live inline in the app-level `registerAs` factory; the
   *   package has no `DEFAULT_LOGGER_CONFIG` fallback anymore.
   */
  public static forRoot(config: ILoggerModuleConfig): DynamicModule {
    // Guard clause — the caller must supply a fully-formed config.
    // Env-var overrides for `LOG_LEVEL` / `APP_DEBUG` are applied
    // inside `LoggerManager.normalize()` at construction time, so
    // the caller can pass whatever shape the config factory produces.
    if (config === undefined || config === null) {
      throw new Error(
        "@stackra/logger: LoggerModule.forRoot(config) requires a config argument. " +
          "Pass a plain `ILoggerModuleConfig`, or use " +
          "`LoggerModule.forRootAsync(loggerConfig.asProvider())` with a " +
          "`registerAs(...)` factory from `@stackra/config`. See " +
          ".kiro/specs/stackra-config-package/PLAN.md §9 for consumer patterns.",
      );
    }

    return {
      module: LoggerModule,
      global: true,
      providers: [
        // Package-internal binding — only classes inside @stackra/logger
        // inject this token. Consumers use `loggerConfig.KEY` at the app
        // level instead.
        { provide: LOGGER_CONFIG_INTERNAL, useValue: config },

        // Context Repository — shared collector for scoped log context.
        ContextRepository,

        // Built-in reporters (auto-discovered via @Reporter decorator).
        ConsoleReporter,
        JsonReporter,
        SilentReporter,

        // LoggerManager — the main service.
        // Alias the class token to the LOGGER_MANAGER symbol so callers
        // can inject either.
        {
          provide: LOGGER_MANAGER,
          useFactory: (mgr: LoggerManager) => mgr,
          inject: [LoggerManager],
        },
        {
          provide: LoggerManager,
          useFactory: (cfg: ILoggerModuleConfig, contextRepo: ContextRepository) => {
            // LoggerManager's constructor normalises the config
            // internally (applies env overrides). We read the
            // NORMALISED level via `manager.getEffectiveConfig()`
            // if downstream setup needs it — but the enricher
            // pipeline below only touches `redact` and
            // `globalContext`, which env overrides don't affect.
            const manager = new LoggerManager(cfg);

            // Enricher registration is explicit — order matters:
            //   1. Interpolation MUST run first to resolve
            //      `{placeholder}` tokens before other enrichers
            //      inspect the message.
            manager.prependEnricher(new InterpolationEnricher());

            //   2. Context enricher — merges the ContextRepository's
            //      per-request bag into every entry's meta.
            manager.addEnricher(new ContextEnricher(contextRepo));

            //   3. Redaction enricher — MUST run AFTER context so it
            //      redacts every field, including those the context
            //      enricher just added.
            if (cfg.redact && cfg.redact.paths.length > 0) {
              manager.addEnricher(new RedactionEnricher(cfg.redact));
            }

            // Seed the global context onto the manager if the caller
            // supplied one.
            if (cfg.globalContext) {
              manager.setGlobalContext(cfg.globalContext);
            }

            return manager;
          },
          inject: [LOGGER_CONFIG_INTERNAL, ContextRepository],
        },

        // Reporter auto-discovery loader — registers all @Reporter
        // providers on init.
        ReporterLoader,
      ],
      // NOTE: `LOGGER_CONFIG_INTERNAL` is intentionally NOT exported —
      // it is a package-private binding. Downstream modules that need
      // the config should inject via the app-owned `loggerConfig.KEY`.
      exports: [LOGGER_MANAGER, LoggerManager, ContextRepository],
    };
  }

  /**
   * Register the logger module globally with an async config.
   *
   * Accepts either the traditional `{ useFactory, inject, imports }`
   * shape OR the exact object returned by `loggerConfig.asProvider()`
   * (they're structurally identical — both satisfy
   * `IConfigModuleAsyncOptions<ILoggerModuleConfig>`).
   *
   * @param options - Async configuration options. When threading a
   *   `registerAs(...)` factory in, pass `loggerConfig.asProvider()`
   *   directly.
   * @returns A `DynamicModule` with the same provider tree as
   *   `forRoot`, but the config resolves via `options.useFactory`.
   */
  public static forRootAsync(
    options: IConfigModuleAsyncOptions<ILoggerModuleConfig>,
  ): DynamicModule {
    return {
      module: LoggerModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        // Async config provider — the manager's constructor normalises
        // env overrides once it receives the resolved value.
        {
          provide: LOGGER_CONFIG_INTERNAL,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },

        // Context Repository.
        ContextRepository,

        // Built-in reporters (auto-discovered via @Reporter decorator).
        ConsoleReporter,
        JsonReporter,
        SilentReporter,

        // LoggerManager alias.
        {
          provide: LOGGER_MANAGER,
          useFactory: (mgr: LoggerManager) => mgr,
          inject: [LoggerManager],
        },
        {
          provide: LoggerManager,
          useFactory: (cfg: ILoggerModuleConfig, contextRepo: ContextRepository) => {
            const manager = new LoggerManager(cfg);

            // Same enricher order as `forRoot` — see the block-comment
            // there for the "why".
            manager.prependEnricher(new InterpolationEnricher());
            manager.addEnricher(new ContextEnricher(contextRepo));

            if (cfg.redact && cfg.redact.paths.length > 0) {
              manager.addEnricher(new RedactionEnricher(cfg.redact));
            }

            if (cfg.globalContext) {
              manager.setGlobalContext(cfg.globalContext);
            }

            return manager;
          },
          inject: [LOGGER_CONFIG_INTERNAL, ContextRepository],
        },

        // Reporter auto-discovery loader — registers all @Reporter
        // providers on init.
        ReporterLoader,

        // Shutdown service — flushes reporters on container teardown.
        LoggerShutdownService,
      ],
      exports: [LOGGER_MANAGER, LoggerManager, ContextRepository],
    };
  }
}
