/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file application.factory.ts
 * @module @stackra/container/application
 * @description Static factory for creating ApplicationContext instances.
 *   Orchestrates the full DI bootstrap: scan → resolve → lifecycle → global register.
 */

import type { Type } from "@stackra/contracts";
import { APP_CONFIG } from "@stackra/contracts";

import { ApplicationBuilder } from "./application-builder.service";
import { ApplicationContext } from "./application-context.service";
import { ModuleContainer } from "@/core/container/container.registry";
import { InstanceLoader } from "@/core/container/instance-loader.service";
import { ModuleRef } from "@/core/container/module-ref";
import { DependenciesScanner } from "@/core/container/scanner.service";
import { DEFAULT_GLOBAL_NAME } from "@/core/constants/tokens.constant";
import { ContainerLogger } from "@/core/devtools/container-logger";
import type { IApplicationFactoryOptions } from "@/core/interfaces/application-factory-options.interface";
import { setGlobalApplicationContext } from "@/core/utils/global-application.util";

/**
 * Factory for creating `ApplicationContext` instances.
 *
 * This class is never instantiated — all methods are static. It mirrors
 * NestJS's `NestFactory` pattern: a static `create()` method that
 * orchestrates scanning, resolution, and lifecycle hooks, returning a
 * fully bootstrapped `ApplicationContext`.
 *
 * @example
 * ```typescript
 * const app = await ApplicationFactory.create(AppModule);
 * const userService = app.get(UserService);
 * ```
 */
export class ApplicationFactory {
  /**
   * Private constructor — this class is never instantiated.
   * All methods are static.
   */
  private constructor() {}

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Create and bootstrap an application context.
   *
   * This is the primary entry point for the entire DI system. It:
   *
   * 1. Creates a `ModuleContainer` and `DependenciesScanner`
   * 2. Scans the module tree starting from the root module
   * 3. Registers `ModuleContainer` as a value provider on every module
   * 4. Registers global `APP_CONFIG` if provided in options
   * 5. Creates all provider instances (via `InstanceLoader`)
   * 6. Calls `onModuleInit()` lifecycle hooks
   * 7. Calls `onApplicationBootstrap()` lifecycle hooks
   * 8. Registers the context as the global application
   * 9. Optionally exposes on `window` for debugging
   * 10. Optionally registers shutdown hooks
   *
   * @param rootModule - The root module class (your AppModule)
   * @param options - Optional configuration for the application context
   * @returns A fully bootstrapped `ApplicationContext`
   *
   * @example
   * ```typescript
   * // Minimal
   * const app = await ApplicationFactory.create(AppModule);
   *
   * // With options
   * const app = await ApplicationFactory.create(AppModule, {
   *   debug: true,
   *   shutdownHooks: true,
   *   config: { apiUrl: 'https://api.example.com' },
   * });
   * ```
   */
  public static async create(
    rootModule: Type<any>,
    options: IApplicationFactoryOptions = {},
  ): Promise<ApplicationContext> {
    // ── Phase 1: Scan ────────────────────────────────────────────────────
    const container = new ModuleContainer();
    const scanner = new DependenciesScanner(container);
    await scanner.scan(rootModule);

    // ── Phase 2: Register internal providers ─────────────────────────────
    // Register ModuleContainer as a value provider on every module so
    // DiscoveryService (or any service needing container access) can
    // inject it. Mirrors NestJS's InternalCoreModule pattern.
    for (const moduleRef of container.getModules().values()) {
      if (!moduleRef.providers.has(ModuleContainer)) {
        container.addProvider({ provide: ModuleContainer, useValue: container }, moduleRef.token);
      }
    }

    // ── Phase 3: Register APP_CONFIG if provided ─────────────────────────
    if (options.config) {
      const rootModuleRef = container.getModuleByToken(rootModule.name);
      if (rootModuleRef) {
        container.addProvider(
          { provide: APP_CONFIG, useValue: options.config },
          rootModuleRef.token,
        );
        container.addExport(APP_CONFIG, rootModuleRef.token);
        // Make root module global so APP_CONFIG is available everywhere
        rootModuleRef.isGlobal = true;
        // Re-bind global scope to include the now-global root module
        container.bindGlobalScope();
      }
    }

    // ── Phase 4: Instantiate ─────────────────────────────────────────────
    const instanceLoader = new InstanceLoader(container);
    const context = new ApplicationContext(container, instanceLoader);

    // ── Phase 4-pre: Register ModuleRef on every module ──────────────────
    // Mirrors NestJS's auto-registered `ModuleRef`. Services inject this
    // class for runtime token resolution (guards, dynamic factories, etc).
    // The instance is shared across modules but tracks its host module on
    // a per-module basis if `select(Module)` is used.
    for (const mod of container.getModules().values()) {
      if (!mod.providers.has(ModuleRef)) {
        const moduleRefInstance = new ModuleRef(context, mod);
        container.addProvider({ provide: ModuleRef, useValue: moduleRefInstance }, mod.token);
      }
    }

    // ── Phase 4a: ContainerLogger ────────────────────────────────────────
    const logger = new ContainerLogger(options.logging);

    if (logger.enabled) {
      logger.start();

      // Log module graph
      for (const [token, moduleRef] of container.getModules()) {
        const providers = [...moduleRef.providers.keys()].map((t) =>
          typeof t === "function" ? t.name : String(t),
        );
        const imports = moduleRef.imports
          ? [...moduleRef.imports].map((m: { name?: string }) => m.name ?? String(m))
          : [];
        logger.logModule(token, moduleRef.isGlobal, providers, imports);
      }
    }

    // Skip instantiation in preview mode (graph-only, no side effects)
    if (!options.preview) {
      await context.init(logger.enabled ? logger : undefined);

      if (logger.enabled) {
        logger.render();
      }
    }

    // ── Phase 5: Register as global ──────────────────────────────────────
    setGlobalApplicationContext(context);

    // ── Phase 6: Debug — expose on window ────────────────────────────────
    const { debug, globalName = DEFAULT_GLOBAL_NAME } = options;
    const isDev =
      debug ?? (typeof process !== "undefined" ? process.env?.NODE_ENV !== "production" : true);

    if (isDev && typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>)[globalName] = context;
    }

    // ── Phase 7: Shutdown hooks ──────────────────────────────────────────
    const shutdownHooks = options.shutdownHooks ?? true;
    if (shutdownHooks) {
      context.enableShutdownHooks();
    }

    // ── Phase 8: Flush logs ──────────────────────────────────────────────
    const autoFlushLogs = options.autoFlushLogs ?? true;
    if (autoFlushLogs && options.bufferLogs) {
      // Future: flush buffered logs here when Logger is implemented
    }

    // ── Phase 9: onReady callback ────────────────────────────────────────
    if (options.onReady) {
      await options.onReady(context);
    }

    return context;
  }

  /**
   * Create a fluent builder for bootstrapping the application.
   *
   * The builder provides a chainable API for configuring lifecycle hooks,
   * shutdown registration, and options before calling `boot()`.
   *
   * Accepts either a direct module class or a factory function returning
   * a promise of the class (for dynamic imports / deferred loading).
   *
   * @param rootModule - The root module class, or a factory function that
   *   returns a promise resolving to the class
   * @returns A new `ApplicationBuilder` instance
   *
   * @example
   * ```typescript
   * // Direct class
   * const app = await ApplicationFactory.builder(AppModule)
   *   .withOptions({ debug: true })
   *   .onBeforeBoot(() => logger.info('Before boot'))
   *   .onBoot((ctx) => ctx.enableShutdownHooks())
   *   .boot();
   *
   * // Dynamic import factory
   * const app = await ApplicationFactory.builder(
   *   () => import('@/lib/app.module').then(m => m.AppModule)
   * ).boot();
   * ```
   */
  public static builder(rootModule: Type<any> | (() => Promise<Type<any>>)): ApplicationBuilder {
    return new ApplicationBuilder(rootModule);
  }
}
