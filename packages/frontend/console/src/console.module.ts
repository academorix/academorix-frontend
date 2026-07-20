/**
 * @file console.module.ts
 * @module @stackra/console
 * @description Root @stackra/container dynamic module for the CLI framework.
 *   Configures the console output service, command registry, command loader,
 *   and registers framework-level built-in commands (list, make:command).
 *
 *   Domain-specific commands (config:publish, cache:clear, queue:work) belong
 *   to their respective owning packages — not here.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     ConsoleModule.forRoot({
 *       binaryName: 'stackra',
 *       verbose: true,
 *     }),
 *   ],
 * })
 * export class CliModule {}
 * ```
 */

import { DiscoveryModule, Module, type DynamicModule } from "@stackra/container";
import { CONSOLE_OUTPUT, CONSOLE_CONFIG } from "@stackra/contracts";
import type { IPublishableConsumer } from "@stackra/contracts";
import { Path } from "@stackra/support";

import {
  ListCommand,
  MakeCommandCommand,
  MakeModuleCommand,
  MakeServiceCommand,
  VendorPublishCommand,
} from "./commands";
import { DEFAULT_BINARY_NAME, DEFAULT_COMMANDS_DIRECTORY, DEFAULT_VERBOSE } from "./constants";
import { ModuleAlreadyRegisteredError } from "./errors";
import type { IConsoleModuleOptions, IConsoleModuleAsyncOptions } from "./interfaces";
import { PublishableLoader, PublishableRegistry } from "./publishing";
import { CommandRegistry } from "./registries";
import { CommandLoader } from "./services/command-loader.service";
import { ConsoleOutput } from "./services/console-output.service";
import { StubRenderer } from "./services/stub-renderer.service";

/**
 * Console CLI framework module.
 *
 * Provides the infrastructure for building and executing console commands
 * within the @stackra/container DI context. Register once in the root CLI module via
 * `forRoot()` or `forRootAsync()`.
 *
 * Registers:
 * - `ConsoleOutput` (under CONSOLE_OUTPUT token) — styled terminal output
 * - `CommandRegistry` — singleton command store with namespace grouping
 * - `CommandLoader` — auto-discovery via DISCOVERY_SERVICE pattern
 * - Built-in framework commands: `list`, `make:command`
 *
 * Each domain package (cache, config, queue, etc.) registers its own
 * commands as providers in its module — the CommandLoader discovers them
 * automatically during bootstrap.
 */
@Module({})
export class ConsoleModule {
  /** Track whether forRoot() has been called. */
  private static registered = false;

  /**
   * Absolute path to the `@stackra/console` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `PublishableConsumer` can auto-read it and fill in `packageRoot`
   * on every `.publish(entry)` call.
   *
   * `1` walk-up from `packages/console/src/console.module.ts`
   * (dirname is `.../src`) reaches `packages/console/` — one level
   * shallower than the canonical `src/core/*.module.ts` layout.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url, 1);

  /**
   * Register the console module globally with static configuration.
   *
   * @param options - Module configuration (all fields optional, defaults applied)
   * @returns Global dynamic module definition
   * @throws {ModuleAlreadyRegisteredError} If called more than once
   */
  public static forRoot(options: Partial<IConsoleModuleOptions> = {}): DynamicModule {
    if (ConsoleModule.registered) {
      throw new ModuleAlreadyRegisteredError();
    }
    ConsoleModule.registered = true;

    const resolvedConfig: Required<IConsoleModuleOptions> = {
      binaryName: options.binaryName ?? DEFAULT_BINARY_NAME,
      commandsDirectory: options.commandsDirectory ?? DEFAULT_COMMANDS_DIRECTORY,
      verbose: options.verbose ?? DEFAULT_VERBOSE,
      commandPaths: options.commandPaths ?? [],
    };

    return {
      module: ConsoleModule,
      global: true,
      imports: [
        // `CommandLoader` injects `DISCOVERY_SERVICE` (from
        // `@stackra/contracts`) to scan every provider carrying the
        // `@Command()` metadata key. Without `DiscoveryModule` on the
        // import list, the container has no binding for that token and
        // bootstrap fails with `Cannot resolve dependency
        // 'Symbol(DISCOVERY_SERVICE)'`. Importing it here keeps
        // `ConsoleModule.forRoot()` self-sufficient — every CLI derived
        // from `@stackra/console` gets discovery for free.
        DiscoveryModule,
      ],
      providers: [
        // Configuration token — resolved defaults available under DI.
        { provide: CONSOLE_CONFIG, useValue: resolvedConfig },

        // Core services — every CLI needs these regardless of the
        // commands it ships.
        { provide: CONSOLE_OUTPUT, useClass: ConsoleOutput },
        ConsoleOutput,
        CommandRegistry,
        CommandLoader,
        StubRenderer,

        // Publishing subdomain — registry + loader that populate it
        // from module `static configurePublishables(consumer)` methods.
        PublishableRegistry,
        PublishableLoader,

        // Framework-level built-in commands — `list`, the `make:*`
        // scaffolders, and `vendor:publish` ship with every CLI derived
        // from `@stackra/console`.
        ListCommand,
        MakeCommandCommand,
        MakeModuleCommand,
        MakeServiceCommand,
        VendorPublishCommand,
      ],
      exports: [
        CONSOLE_OUTPUT,
        CONSOLE_CONFIG,
        ConsoleOutput,
        CommandRegistry,
        StubRenderer,
        PublishableRegistry,
      ],
    };
  }

  /**
   * Register the console module globally with async configuration.
   *
   * @param options - Async module configuration with factory provider
   * @returns Global dynamic module definition
   * @throws {ModuleAlreadyRegisteredError} If called more than once
   */
  public static forRootAsync(options: IConsoleModuleAsyncOptions): DynamicModule {
    if (ConsoleModule.registered) {
      throw new ModuleAlreadyRegisteredError();
    }
    ConsoleModule.registered = true;

    return {
      module: ConsoleModule,
      global: true,
      imports: [
        // Same rationale as `forRoot` — `CommandLoader` needs
        // `DISCOVERY_SERVICE` provided by `DiscoveryModule`.
        DiscoveryModule,
      ],
      providers: [
        // Async configuration via factory — every field is merged with
        // its default so the factory can return a partial shape.
        {
          provide: CONSOLE_CONFIG,
          useFactory: async (...args: unknown[]) => {
            const config = await options.useFactory(...args);
            return {
              binaryName: config.binaryName ?? DEFAULT_BINARY_NAME,
              commandsDirectory: config.commandsDirectory ?? DEFAULT_COMMANDS_DIRECTORY,
              verbose: config.verbose ?? DEFAULT_VERBOSE,
              commandPaths: config.commandPaths ?? [],
            };
          },
          inject: options.inject ?? [],
        },

        // Core services (same as `forRoot`).
        { provide: CONSOLE_OUTPUT, useClass: ConsoleOutput },
        ConsoleOutput,
        CommandRegistry,
        CommandLoader,
        StubRenderer,

        // Publishing subdomain.
        PublishableRegistry,
        PublishableLoader,

        // Framework-level built-in commands.
        ListCommand,
        MakeCommandCommand,
        MakeModuleCommand,
        MakeServiceCommand,
        VendorPublishCommand,
      ],
      exports: [
        CONSOLE_OUTPUT,
        CONSOLE_CONFIG,
        ConsoleOutput,
        CommandRegistry,
        StubRenderer,
        PublishableRegistry,
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/console` owns.
   *
   * Ships the `stubs/command.ejs` + `module.ejs` + `service.ejs`
   * templates so apps that want their own `make:*` generators can
   * publish + customize them.
   *
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above.
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer.publish({
      tag: "console-stubs",
      description: "Publish the console make:* stub templates.",
      files: ["stubs/command.ejs", "stubs/module.ejs", "stubs/service.ejs"],
    });
  }
}
