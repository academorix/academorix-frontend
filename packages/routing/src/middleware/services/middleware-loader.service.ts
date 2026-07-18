/**
 * @file middleware-loader.service.ts
 * @module @stackra/routing/middleware/services
 * @description Discovers every `@Middleware`-decorated class in the
 *   DI graph and registers it with `MiddlewareRegistryService`.
 *
 *   Uses `discovery.getProvidersByMetadata(MIDDLEWARE_METADATA_KEY)`
 *   per package-conventions rule — never a manual scan through
 *   `getProviders()` with a metadata filter.
 *
 *   Runs at `OnApplicationBootstrap` so every module has finished
 *   `onModuleInit` (and its providers are fully wired) before we
 *   snapshot them.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type {
  IDiscoveryService,
  ILoggerManager,
  IMiddleware,
  IMiddlewareOptions,
  OnApplicationBootstrap,
} from "@stackra/contracts";
import { DISCOVERY_SERVICE, LOGGER_MANAGER, MIDDLEWARE_METADATA_KEY } from "@stackra/contracts";
import { getMetadata } from "@vivtel/metadata";

import { MiddlewareRegistryService } from "./middleware-registry.service";

/**
 * Discovery loader for `@Middleware`-decorated classes.
 */
@Injectable()
export class MiddlewareLoaderService implements OnApplicationBootstrap {
  public constructor(
    private readonly registry: MiddlewareRegistryService,
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService,
    @Optional()
    @Inject(LOGGER_MANAGER)
    private readonly loggerManager?: ILoggerManager,
  ) {}

  /**
   * Snapshot every `@Middleware`-decorated provider and register it.
   * Fail-soft when the discovery service is absent — the registry
   * still works with programmatic registrations.
   */
  public onApplicationBootstrap(): void {
    if (!this.discovery) {
      // Discovery is optional at the framework layer — apps that
      // don't wire it fall back to explicit `forFeature` seeds.
      this.debug("No discovery service — skipping middleware auto-scan.");
      return;
    }

    // `getProvidersByMetadata` returns every provider whose metatype
    // carries the metadata key. We read the metadata off the metatype
    // (not the instance) because the constructor is what the
    // decorator stamped.
    const providers = this.discovery.getProvidersByMetadata(MIDDLEWARE_METADATA_KEY);
    for (const provider of providers) {
      const metatype = provider.metatype;
      if (!metatype) continue;
      // Read through `@vivtel/metadata` — the same helper the
      // decorator wrote through, so the read is symmetric with the
      // write and inherits the same prototype-chain semantics.
      const options = getMetadata<IMiddlewareOptions>(MIDDLEWARE_METADATA_KEY, metatype);
      if (!options) continue;
      this.registry.registerMiddleware(options, metatype as new (...args: never[]) => IMiddleware);
    }
  }

  /**
   * Emit a debug-level log message. Fail-soft when no logger is
   * wired.
   */
  private debug(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.middleware").debug(message);
    } catch {
      // fail-soft — swallow logger failures during discovery.
    }
  }
}
