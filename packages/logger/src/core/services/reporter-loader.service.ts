/**
 * @file reporter-loader.service.ts
 * @module @stackra/logger/core/services
 * @description Auto-discovery loader for log reporters.
 *   Implements OnApplicationBootstrap to scan all providers decorated with
 *   @Reporter() and registers them with the LoggerManager automatically.
 *
 *   This eliminates manual `manager.registerReporter(x)` calls — any class
 *   decorated with `@Reporter('name')` and registered as a provider in any
 *   module will be auto-discovered and registered at boot time.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import {
  DISCOVERY_SERVICE,
  LOGGER_MANAGER,
  type IDiscoveryService,
  type ILoggerManager,
  type ILogReporter,
  type OnApplicationBootstrap,
} from "@stackra/contracts";

import { REPORTER_METADATA_KEY } from "@/core/decorators/reporter-metadata.constant";

/**
 * Reporter loader — auto-discovers and registers all @Reporter-decorated providers.
 *
 * On module initialization, scans the DI container for all providers that have
 * the `REPORTER_METADATA_KEY` metadata (set by the `@Reporter('name')` decorator).
 * Each discovered provider is validated as implementing `ILogReporter` and
 * registered with the LoggerManager.
 *
 * This service is registered by `LoggerModule.forRoot()` and works with both
 * `@stackra/container` (browser) and NestJS (server) via the platform-agnostic
 * `IDiscoveryService` interface.
 *
 * @example
 * ```typescript
 * // Any reporter decorated with @Reporter and registered as a provider
 * // will be auto-discovered — no manual registerReporter() needed:
 *
 * @Reporter('datadog')
 * @Injectable()
 * export class DatadogReporter implements ILogReporter {
 *   readonly name = 'datadog';
 *   write(entry: ILogEntry): void { ... }
 * }
 *
 * // Just register it as a provider in any module:
 * @Module({ providers: [DatadogReporter] })
 * export class ObservabilityModule {}
 * ```
 */
@Injectable()
export class ReporterLoader implements OnApplicationBootstrap {
  /**
   * @param discovery - Platform-agnostic discovery service for scanning providers
   * @param manager - LoggerManager to register discovered reporters with
   */
  public constructor(
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery: IDiscoveryService | undefined,
    @Inject(LOGGER_MANAGER)
    private readonly manager: ILoggerManager,
  ) {}

  /**
   * Called after every module has initialised. Scans all providers for
   * @Reporter metadata and registers each discovered reporter with the
   * LoggerManager. Container-wide discovery must run in
   * `onApplicationBootstrap` so reporters from later-initialised modules
   * aren't missed.
   *
   * If no discovery service is available (e.g., during testing or before
   * the DiscoveryModule is loaded), this is a no-op — reporters can still
   * be registered manually via `manager.registerReporter()`.
   */
  public onApplicationBootstrap(): void {
    if (!this.discovery) return;

    const providers = this.discovery.getProvidersByMetadata(REPORTER_METADATA_KEY);

    for (const { instance } of providers) {
      if (this.isReporter(instance)) {
        (this.manager as any).registerReporter(instance);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Validate that an instance implements the ILogReporter interface.
   *
   * @param instance - The provider instance to validate
   * @returns True if the instance has `name` (string) and `write` (function)
   */
  private isReporter(instance: unknown): instance is ILogReporter {
    if (!instance || typeof instance !== "object") return false;
    const candidate = instance as Record<string, unknown>;
    return typeof candidate.name === "string" && typeof candidate.write === "function";
  }
}
