/**
 * @file register-as.util.ts
 * @module @stackra/config/core/utils
 * @description Canonical config-factory registration helper.
 *
 *   `registerAs('<namespace>', factory)` decorates the passed
 *   factory with:
 *   - `.KEY` — the derived string DI token consumers `@Inject(...)`.
 *   - `.asProvider()` — the async-options tuple for
 *     `<X>Module.forRootAsync`.
 *   - `.namespace` — the raw string namespace (Stackra addition).
 *   - Internal marker symbols (`PARTIAL_CONFIGURATION_KEY`,
 *     `AS_PROVIDER_METHOD_KEY`) so `ConfigModule` can identify the
 *     factory during the load step.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/register-as.util.ts (MIT, © Kamil Myśliwiec)
 */

import type {
  ConfigObject,
  DynamicModule,
  IConfigFactory,
  IConfigFactoryKeyHost,
} from "@stackra/contracts";

import {
  AS_PROVIDER_METHOD_KEY,
  PARTIAL_CONFIGURATION_KEY,
  PARTIAL_CONFIGURATION_PROPNAME,
} from "../constants";
import { getConfigToken } from "./get-config-token.util";

/**
 * Deferred accessor for the `ConfigModule` class.
 *
 * Populated by `ConfigModule` itself via {@link __setConfigModuleRef}
 * during its module-level side effect. This handshake breaks the
 * `register-as` ↔ `config.module` circular dependency without needing
 * a runtime `require(...)` (which doesn't exist under ESM).
 *
 * Package-internal.
 */
let deferredConfigModule: { forFeature(config: IConfigFactory): DynamicModule } | undefined;

/**
 * Register the `ConfigModule` reference for later use by `.asProvider()`.
 *
 * Called exactly once during `ConfigModule`'s module evaluation.
 * Package-internal — consumers must not call this.
 *
 * @internal
 */
export function __setConfigModuleRef(module: {
  forFeature(config: IConfigFactory): DynamicModule;
}): void {
  deferredConfigModule = module;
}

/**
 * Return the `ConfigModule` reference, throwing when it has not been
 * registered yet.
 *
 * Package-internal — only invoked from inside `.asProvider()` after
 * both modules have finished evaluating.
 */
function resolveConfigModule(): { forFeature(config: IConfigFactory): DynamicModule } {
  if (!deferredConfigModule) {
    // Defensive — should never trigger under normal bootstrap because
    // `ConfigModule`'s file-level side effect populates the reference
    // before any consumer code runs. A helpful error beats a silent
    // undefined at the call site.
    throw new Error(
      "[@stackra/config] ConfigModule is not yet available when calling .asProvider(). " +
        "This indicates an import-order bug in the framework — please open an issue.",
    );
  }
  return deferredConfigModule;
}

/**
 * Register a configuration factory under a namespace token.
 *
 * The factory is returned unchanged but decorated with non-enumerable
 * `.KEY` / `.asProvider()` properties AND the internal marker symbols
 * `ConfigModule` uses to identify the registration during
 * `forRoot({ load: [factory] })`.
 *
 * `.KEY` is derived via `getConfigToken(token)` — e.g.
 * `getConfigToken('cache')` produces `'CONFIGURATION(cache)'`. The
 * value is a plain string so consumers can spell it in type
 * annotations (`@Inject(cacheConfig.KEY) cfg: ...`).
 *
 * `.asProvider()` returns an `IConfigModuleAsyncOptions`-shaped
 * object that `<X>Module.forRootAsync(cfg.asProvider())` accepts
 * without any glue code — the returned `imports` includes a
 * `ConfigModule.forFeature(factory)` so the factory's KEY resolves
 * downstream.
 *
 * @typeParam TConfig - Shape of the config object the factory produces.
 * @typeParam TFactory - Callable signature of the factory.
 * @param token - String or symbol namespace (`'cache'`, etc.).
 * @param configFactory - Factory returning the config object (may
 *   return a Promise for async loading).
 * @returns The same factory reference, decorated with `.KEY` +
 *   `.asProvider()` + marker symbols.
 *
 * @example
 * ```typescript
 * import { registerAs, env } from '@stackra/config';
 * import type { ICacheModuleConfig } from '@stackra/cache';
 *
 * export const cacheConfig = registerAs<ICacheModuleConfig>('cache', () => ({
 *   default: env('CACHE_STORE', 'memory'),
 *   ttl: env.number('CACHE_TTL', 3600),
 * }));
 *
 * // consumers:
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [cacheConfig] }),
 *     CacheModule.forRootAsync(cacheConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export function registerAs<
  TConfig extends ConfigObject,
  TFactory extends IConfigFactory<TConfig> = IConfigFactory<TConfig>,
>(
  token: string | symbol,
  configFactory: TFactory,
): TFactory & IConfigFactoryKeyHost<Awaited<ReturnType<TFactory>>> {
  const derivedToken = getConfigToken(token);
  // Consolidated defineProperty helper — every stamped property is
  // non-enumerable + non-writable + non-configurable so consumer code
  // cannot accidentally mutate or shadow the decoration. The internal
  // marker symbols matter for `getRegistrationToken` + `mergeConfigObject`
  // during the load-time merge step.
  const defineProperty = (key: string | symbol, value: unknown): void => {
    Object.defineProperty(configFactory, key, {
      configurable: false,
      enumerable: false,
      value,
      writable: false,
    });
  };

  // ── Package-internal markers ─────────────────────────────────────
  // The namespace token (`'cache'`) — used by `getRegistrationToken`
  // during `mergeConfigObject` to route the partial to the right slot.
  defineProperty(PARTIAL_CONFIGURATION_KEY, token);
  // The user-facing `.KEY` — a string DI token consumers `@Inject(...)`.
  defineProperty(PARTIAL_CONFIGURATION_PROPNAME, derivedToken);
  // The user-facing `.asProvider()` helper — returns the async-options
  // tuple for `<X>Module.forRootAsync`. The `ConfigModule` reference is
  // resolved lazily via a dynamic namespace read on the module's
  // ESM record — the top-level `import` statement creates a live
  // binding that's populated by the time consumers call
  // `.asProvider()` at bootstrap time (long after every module has
  // finished evaluating). Direct static import inside register-as
  // would create a circular reference the bundler cannot resolve
  // (register-as → config.module → utils/index → register-as).
  defineProperty(AS_PROVIDER_METHOD_KEY, function asProvider(): {
    imports: DynamicModule[];
    useFactory: (config: Awaited<ReturnType<TFactory>>) => Awaited<ReturnType<TFactory>>;
    inject: [string];
  } {
    // Deferred resolution — pulled from the injected accessor set by
    // the module code below. This IIFE-style handshake keeps
    // `registerAs` importable before `ConfigModule` has finished
    // evaluating.
    const ConfigModuleRef = resolveConfigModule();
    return {
      imports: [ConfigModuleRef.forFeature(configFactory as unknown as IConfigFactory)],
      // Identity factory — the real work is done by the
      // `ConfigModule.forFeature` provider that binds `derivedToken`.
      // `<X>Module.forRootAsync` calls `useFactory` with the injected
      // config, and we hand it right back.
      useFactory: (config) => config,
      inject: [derivedToken],
    };
  });

  // ── Stackra addition — public `.namespace` metadata ──────────────
  // Nestjs stashes the namespace on the private
  // `PARTIAL_CONFIGURATION_KEY` symbol; consumers who want to
  // introspect the namespace at runtime (Vite plugin, JSON schema
  // export, debug endpoint) had to reach for that symbol. We expose
  // it directly as an enumerable-false read-only property named
  // `namespace` so tooling can discover it without a private symbol
  // handshake.
  defineProperty(
    "namespace",
    typeof token === "string" ? token : (token.description ?? String(token)),
  );

  // The runtime shape now matches `IConfigFactoryKeyHost` — the cast
  // documents the widening for TypeScript.
  return configFactory as TFactory & IConfigFactoryKeyHost<Awaited<ReturnType<TFactory>>>;
}
