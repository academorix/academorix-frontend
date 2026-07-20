/**
 * @file guard-loader.service.ts
 * @module @stackra/routing/guards/services
 * @description Discovers every `@Guard`-decorated class in the DI graph
 *   and registers it with `GuardRegistryService`.
 *
 *   Uses `discovery.getProvidersByMetadata(GUARD_METADATA_KEY)`. Runs
 *   at `OnApplicationBootstrap` so every module has finished
 *   `onModuleInit` first.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type {
  ICanActivate,
  IDiscoveryService,
  IGuardOptions,
  ILoggerManager,
  OnApplicationBootstrap,
} from "@stackra/contracts";
import { DISCOVERY_SERVICE, GUARD_METADATA_KEY, LOGGER_MANAGER } from "@stackra/contracts";
import { getMetadata } from "@vivtel/metadata";

import { GuardRegistryService } from "./guard-registry.service";

/**
 * Discovery loader for `@Guard`-decorated classes.
 */
@Injectable()
export class GuardLoaderService implements OnApplicationBootstrap {
  public constructor(
    private readonly registry: GuardRegistryService,
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService,
    @Optional()
    @Inject(LOGGER_MANAGER)
    private readonly loggerManager?: ILoggerManager,
  ) {}

  /**
   * Snapshot every `@Guard`-decorated provider and register it.
   */
  public onApplicationBootstrap(): void {
    if (!this.discovery) {
      // Discovery is optional at the framework layer.
      this.debug("No discovery service — skipping guard auto-scan.");
      return;
    }

    const providers = this.discovery.getProvidersByMetadata(GUARD_METADATA_KEY);
    for (const provider of providers) {
      const metatype = provider.metatype;
      if (!metatype) continue;
      // Symmetric with the `@Guard(...)` decorator's write path.
      const options = getMetadata<IGuardOptions>(GUARD_METADATA_KEY, metatype);
      if (!options) continue;
      this.registry.registerGuard(options, metatype as new (...args: never[]) => ICanActivate);
    }
  }

  /** Emit a debug-level log. Fail-soft when no logger is wired. */
  private debug(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.guards").debug(message);
    } catch {
      // fail-soft
    }
  }
}
