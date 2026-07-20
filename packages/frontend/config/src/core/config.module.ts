/**
 * @file config.module.ts
 * @module @stackra/config/core
 * @description Primary entry point — `ConfigModule.forRoot` /
 *   `ConfigModule.forFeature` / `envVariablesLoaded`.
 *
 *   Every fs / dotenv / dotenv-expand interaction is guarded behind
 *   `isNode()` + dynamic imports so the browser bundle stays clean.
 *   The load-time merge providers use `createSeedLoader` +
 *   `seedLoaderToken` from `@stackra/support` per
 *   `.kiro/steering/module-lifecycle.md` — no sentinel-return-null
 *   factory pattern.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.module.ts (MIT, © Kamil Myśliwiec)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Module,
  type DynamicModule,
  type FactoryProvider,
  type Provider,
} from "@stackra/container";
import {
  CONFIGURATION_LOADER,
  CONFIGURATION_SERVICE_TOKEN,
  CONFIGURATION_TOKEN,
  VALIDATED_ENV_LOADER,
  type IConfigFactory,
  type IConfigFactoryKeyHost,
  type IConfigModuleOptions,
  type IPublishableConsumer,
  type Parser,
} from "@stackra/contracts";
import { Path, createSeedLoader, seedLoaderToken } from "@stackra/support";

import { VALIDATED_ENV_PROPNAME } from "./constants";
import { ConfigValidationError } from "./errors";
import { ConfigService } from "./services";
import {
  createConfigProvider,
  getDefaultParser,
  getRegistrationToken,
  isNode,
  loadEnvFile,
  mergeConfigObject,
} from "./utils";
import { __setConfigModuleRef } from "./utils/register-as.util";

/**
 * Package-internal helper — checks whether a value is a plain object.
 * Inlined from `@nestjs/common/utils/shared.utils` to avoid a
 * cross-package import for two lines of code.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * DI module for the `@stackra/config` package.
 *
 * `forRoot` is async because env-file loading is optionally async
 * (fs + dotenv are lazy-imported when `isNode()`). Returns a
 * `Promise<DynamicModule>` — every consumer must `await` the call
 * inside `@Module({ imports: [...] })` (a Promise is a valid module
 * entry in the container's module-resolution semantics, per NestJS).
 *
 * The module binds its own `CONFIGURATION_TOKEN`, `ConfigService`,
 * and `CONFIGURATION_SERVICE_TOKEN` providers rather than delegating
 * to a `ConfigHostModule` — keeps the module graph flat and avoids
 * cross-module `useExisting` resolution.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { cacheConfig } from '@/config/cache.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       isGlobal: true,
 *       load: [cacheConfig],
 *       cache: true,
 *     }),
 *     CacheModule.forRootAsync(cacheConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ConfigModule {
  /**
   * Absolute path to the `@stackra/config` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `@stackra/console`'s `PublishableConsumer` can auto-read it.
   *
   * `../../..` walks from `packages/config/src/core/` up to
   * `packages/config/`.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  // ── envVariablesLoaded — resolves after `forRoot` finishes ──────

  /**
   * Signal function for `_envVariablesLoaded`. Populated by the
   * Promise executor below at class-static evaluation. Package-internal.
   */
  private static environmentVariablesLoadedSignal: () => void = () => {
    // Placeholder — replaced during the promise executor below.
  };

  /**
   * Backing promise for `envVariablesLoaded`. Resolves after
   * `forRoot` finishes loading env files + running validation.
   * Modules downstream (`ConditionalModule`) await this before
   * evaluating their predicates.
   */
  private static readonly _envVariablesLoaded: Promise<void> = new Promise<void>((resolve) => {
    ConfigModule.environmentVariablesLoadedSignal = resolve;
  });

  /**
   * Promise that resolves when env vars are loaded.
   *
   * `ConditionalModule.registerWhen(...)` awaits this promise
   * before evaluating its condition, so predicates that read
   * `process.env` see the same state `ConfigService` will read.
   */
  public static get envVariablesLoaded(): Promise<void> {
    return this._envVariablesLoaded;
  }

  // ── forRoot ─────────────────────────────────────────────────────

  /**
   * Load env vars + register namespaced configs.
   *
   * @param options - Options bag; every field is optional.
   * @returns A dynamic-module `Promise` — always await this in your
   *   `imports: [...]` list.
   *
   * @throws {ConfigValidationError} When `validate` or
   *   `validationSchema` fails.
   */
  public static async forRoot<ValidationOptions extends Record<string, any>>(
    options: IConfigModuleOptions<ValidationOptions> = {},
  ): Promise<DynamicModule> {
    // ── Resolve env file paths + parser ──────────────────────────
    const envFilePaths = await this.resolveEnvFilePaths(options.envFilePath);
    const parser: Parser = options.parser ?? (await getDefaultParser());

    // ── Load env files (Node only) ───────────────────────────────
    let validatedEnvConfig: Record<string, unknown> | undefined;
    let config: Record<string, unknown> = options.ignoreEnvFile
      ? {}
      : await this.loadEnvFileGuarded(envFilePaths, parser, options);

    // ── Merge process.env into the record (Node only) ────────────
    // `ignoreEnvVars` is the deprecated toggle; `validatePredefined`
    // is the new one. When `validatePredefined === false`, we skip
    // the merge (validation only sees env-file values).
    if (!options.ignoreEnvVars && options.validatePredefined !== false && isNode()) {
      config = options.override ? { ...process.env, ...config } : { ...config, ...process.env };
    }

    // ── Validation ──────────────────────────────────────────────
    if (options.validate) {
      let validated: Record<string, unknown>;

      try {
        validated = options.validate(config);
      } catch (cause) {
        throw new ConfigValidationError(
          cause instanceof Error ? cause.message : String(cause),
          cause,
        );
      }
      validatedEnvConfig = validated;
      this.assignVariablesToProcess(validated, options.override);
    } else if (options.validationSchema) {
      const validationOptions = this.getSchemaValidationOptions(options);
      const { error, value: validatedConfig } = options.validationSchema.validate(
        config,
        validationOptions,
      );

      if (error) {
        throw new ConfigValidationError(error.message ?? String(error), error);
      }
      const validated = validatedConfig as Record<string, unknown>;

      validatedEnvConfig = validated;
      this.assignVariablesToProcess(validated, options.override);
    } else {
      this.assignVariablesToProcess(config, options.override);
    }

    // ── Build providers from `load: [...]` factories ─────────────
    const isConfigToLoad = Array.isArray(options.load) && options.load.length > 0;
    const configFactories = await Promise.all(options.load ?? []);
    const configProviders = configFactories
      .map((factory) => createConfigProvider(factory as IConfigFactory & IConfigFactoryKeyHost))
      .filter((item): item is FactoryProvider => item !== undefined);

    const configProviderTokens = configProviders.map((item) => item.provide);

    // ── Build the module's provider list ─────────────────────────
    // The internal config host is a fresh mutable record — every
    // seed loader (load, validated env) writes into this same
    // reference, and `ConfigService` reads through the injected
    // reference.
    const internalConfig: Record<string, unknown> = {};

    // Capture the `skipProcessEnv` option early so the closure below
    // sees the exact user intent (avoids narrowing loss inside seed
    // loaders that TypeScript can't track).
    const skipProcessEnv = options.skipProcessEnv === true;

    const providers: Provider[] = [
      // The host record — same reference used by every downstream
      // provider so mutations via seed loaders are visible to the
      // service instance.
      { provide: CONFIGURATION_TOKEN, useValue: internalConfig },
      // The `ConfigService` class — `useClass` binding wires the
      // constructor's `@Inject(CONFIGURATION_TOKEN)` dep to the value
      // above.
      { provide: ConfigService, useClass: ConfigService },
      // Contract-token alias — a downstream consumer can inject
      // `IConfigService` via `CONFIGURATION_SERVICE_TOKEN` without
      // importing the concrete class from `@stackra/config`.
      { provide: CONFIGURATION_SERVICE_TOKEN, useExisting: ConfigService },
      // Every registered config factory bound under its `.KEY`.
      ...configProviders,
      // Seed loader — records env-file paths, parser, and the
      // skipProcessEnv toggle on the ConfigService instance during
      // `onApplicationBootstrap`. Prefer this over a `useFactory`
      // that mutates + returns the service, per module-lifecycle.md.
      {
        provide: seedLoaderToken("config-service-setup"),
        useFactory: (service: ConfigService) =>
          createSeedLoader(() => {
            service.setEnvFilePaths(envFilePaths);
            service.setParser(parser);
            if (skipProcessEnv) {
              service.skipProcessEnv = true;
            }
          }),
        inject: [ConfigService],
      } satisfies FactoryProvider,
    ];

    // ── VALIDATED_ENV_LOADER — writes the validated slot ─────────
    if (validatedEnvConfig !== undefined) {
      const validatedEnv: Record<string, unknown> = validatedEnvConfig;

      providers.push({
        provide: VALIDATED_ENV_LOADER,
        useFactory: (host: Record<string, any>) =>
          createSeedLoader(() => {
            host[VALIDATED_ENV_PROPNAME] = validatedEnv;
          }),
        inject: [CONFIGURATION_TOKEN],
      } satisfies FactoryProvider);
    }

    // ── Fire the envVariablesLoaded signal ──────────────────────
    // Fires BEFORE the seed loaders run — matches nestjs behavior
    // (the "loaded" signal reports env parsing, not merge).
    this.environmentVariablesLoadedSignal();

    // ── CONFIGURATION_LOADER — merges namespaced configs ─────────
    if (isConfigToLoad) {
      // Snapshot before we push the loader itself.
      const providersSnapshot = [...configProviders];

      providers.push({
        provide: CONFIGURATION_LOADER,
        useFactory: (host: Record<string, any>, ...configurations: Record<string, any>[]) =>
          createSeedLoader(() => {
            configurations.forEach((partial, index) => {
              const provider = providersSnapshot[index];

              if (provider === undefined) return;
              this.mergePartial(host, partial, provider);
            });
          }),
        inject: [CONFIGURATION_TOKEN, ...configProviderTokens],
      } satisfies FactoryProvider);
    }

    return {
      module: ConfigModule,
      global: options.isGlobal,
      providers,
      // Export the class + every namespace token so downstream modules
      // can inject them without re-declaring the imports.
      exports: [
        ConfigService,
        CONFIGURATION_SERVICE_TOKEN,
        CONFIGURATION_TOKEN,
        ...configProviderTokens,
      ],
    };
  }

  // ── forFeature ──────────────────────────────────────────────────

  /**
   * Partial registration for feature modules.
   *
   * Binds a single `registerAs(...)` factory under its `.KEY` and
   * merges its return value into the internal config host record.
   * Consumers typically DON'T call this directly — `.asProvider()`
   * on a registered factory does it for them.
   *
   * Requires `ConfigModule.forRoot(...)` to have already been imported
   * (globally or via a chain of imports) — this feature module needs
   * `CONFIGURATION_TOKEN` in scope.
   *
   * @param config - Factory produced by `registerAs`.
   * @returns Dynamic module registering the factory + a seed loader.
   */
  public static forFeature(config: IConfigFactory): DynamicModule {
    const configProvider = createConfigProvider(config as IConfigFactory & IConfigFactoryKeyHost);

    return {
      module: ConfigModule,
      providers: [
        configProvider,
        // Seed loader — merges the partial config into the internal
        // host record when the container reaches
        // `onApplicationBootstrap`. Unique per feature registration
        // so contributions don't collide under the container's
        // last-wins semantics.
        {
          provide: seedLoaderToken(`config-feature:${String(configProvider.provide)}`),
          useFactory: (host: Record<string, any>, partialConfig: Record<string, any>) =>
            createSeedLoader(() => {
              this.mergePartial(host, partialConfig, configProvider);
            }),
          inject: [CONFIGURATION_TOKEN, configProvider.provide],
        } satisfies FactoryProvider,
      ],
      exports: [configProvider.provide],
    };
  }

  // ── Private helpers ────────────────────────────────────────────

  /**
   * Resolve env file paths, applying the default when nothing was
   * supplied. Guarded — returns an empty list in browser runtimes.
   */
  private static async resolveEnvFilePaths(envFilePath?: string | string[]): Promise<string[]> {
    if (!isNode()) return [];
    if (Array.isArray(envFilePath)) return envFilePath;
    if (typeof envFilePath === "string") return [envFilePath];
    const { resolve } = await import("node:path");

    return [resolve(process.cwd(), ".env")];
  }

  /**
   * Guarded env-file loader — returns `{}` in browser runtimes.
   */
  private static async loadEnvFileGuarded(
    envFilePaths: string[],
    parser: Parser,
    options: IConfigModuleOptions,
  ): Promise<Record<string, unknown>> {
    if (!isNode()) return {};
    const expandVariables = options.expandVariables;

    return loadEnvFile(envFilePaths, parser, {
      ...(expandVariables !== undefined ? { expandVariables } : {}),
    });
  }

  /**
   * Copy env values into `process.env` — Node-only.
   *
   * `override: true` overwrites existing values; otherwise only unset
   * keys are written. Matches nestjs's semantics.
   */
  private static assignVariablesToProcess(
    config: Record<string, unknown>,
    override?: boolean,
  ): void {
    if (!isNode()) return;
    if (!isObject(config)) return;
    const keys = override
      ? Object.keys(config)
      : Object.keys(config).filter((key) => !(key in process.env));

    for (const key of keys) {
      const value = config[key];

      if (typeof value === "string") {
        process.env[key] = value;
      } else if (typeof value === "boolean" || typeof value === "number") {
        process.env[key] = `${value}`;
      }
    }
  }

  /**
   * Merge a partial config into the internal host record under the
   * namespace token stamped on the factory by `registerAs`.
   */
  private static mergePartial(
    host: Record<string, any>,
    partial: Record<string, any>,
    provider: FactoryProvider,
  ): void {
    const factoryRef = provider.useFactory as unknown;
    const token = getRegistrationToken(factoryRef);

    mergeConfigObject(host, partial, token);
  }

  /**
   * Apply nestjs's default Joi validation options.
   *
   * `abortEarly: false` produces a full error report; `allowUnknown: true`
   * lets non-schema keys pass through so consumers can enrich their env
   * with app-specific vars without extending the schema.
   */
  private static getSchemaValidationOptions(options: IConfigModuleOptions): Record<string, any> {
    if (options.validationOptions) {
      const validationOptions = { ...options.validationOptions } as Record<string, unknown>;

      if (typeof validationOptions.allowUnknown === "undefined") {
        validationOptions.allowUnknown = true;
      }

      return validationOptions;
    }

    return {
      abortEarly: false,
      allowUnknown: true,
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/config` owns.
   *
   * Ships the reference `config/config.config.ts` template so apps can
   * publish it via `stackra vendor:publish --tag=stackra-config` and
   * customize their own config loader / env parser wiring.
   *
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above.
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer.publish({
      tag: "stackra-config",
      description: "Reference @stackra/config config file for the app.",
      files: ["config/config.config.ts"],
    });
  }
}

// ── register-as ↔ config.module handshake ─────────────────────────
// `register-as.util` stores this reference in a module-scoped variable
// so `.asProvider()` can call `ConfigModule.forFeature(...)` without a
// direct static import (which would create a bundler-visible cycle:
// register-as → config.module → utils → register-as).
__setConfigModuleRef(ConfigModule);
