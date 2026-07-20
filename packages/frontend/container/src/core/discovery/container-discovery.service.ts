/**
 * @file container-discovery.service.ts
 * @module @stackra/container/services
 * @description Platform-agnostic IDiscoveryService implementation for container.
 *   Wraps the internal DiscoveryService to implement the cross-package
 *   IDiscoveryService contract from @stackra/contracts. This allows any loader
 *   service (ReporterLoader, CacheStoreLoader, etc.) to inject DISCOVERY_SERVICE
 *   and discover decorated providers without coupling to container internals.
 */

import { getMetadata } from "@vivtel/metadata";
import type { IDiscoveryProvider, IDiscoveryService, Type } from "@stackra/contracts";

import { Injectable } from "@/core/decorators/injectable.decorator";
import { InstanceWrapper } from "@/core/container/instance-wrapper";
import { ModuleContainer } from "@/core/container/container.registry";

import { DiscoveryService } from "./discovery.service";

/**
 * container implementation of the cross-package IDiscoveryService contract.
 *
 * Delegates to the internal DiscoveryService (which handles both container's
 * native module graph and the NestJS bridge) and normalizes results into
 * the IDiscoveryProvider shape that loader services expect.
 *
 * Registered globally by DiscoveryModule and bound to the DISCOVERY_SERVICE token,
 * making it available to any package that injects `@Inject(DISCOVERY_SERVICE)`.
 *
 * @example
 * ```typescript
 * // Discovery loaders scan the whole container, so they run in
 * // onApplicationBootstrap (after every module has finished onModuleInit).
 * @Injectable()
 * export class ReporterLoader implements OnApplicationBootstrap {
 *   constructor(
 *     @Inject(DISCOVERY_SERVICE) private readonly discovery: IDiscoveryService,
 *   ) {}
 *
 *   onApplicationBootstrap(): void {
 *     const reporters = this.discovery.getProvidersByMetadata(REPORTER_METADATA_KEY);
 *     // ... register each reporter
 *   }
 * }
 * ```
 */
@Injectable()
export class ContainerDiscoveryService implements IDiscoveryService {
  /**
   * @param discoveryService - The internal container `DiscoveryService`.
   *   Reused for the provider-axis discovery methods (`getProviders`,
   *   `getProvidersByMetadata`) so we don't duplicate the reflection logic.
   * @param modulesContainer - The container's active module registry. Reused
   *   for the module-axis discovery (`getModules`) — iterated at CLI time
   *   to find every module class carrying a `configurePublishables`-style
   *   static manifest method.
   */
  public constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly modulesContainer: ModuleContainer,
  ) {}

  /**
   * Get all providers registered in the current module graph.
   *
   * Scans the container module graph (or the NestJS bridge if active)
   * and returns all class-based providers normalized as IDiscoveryProvider.
   *
   * @returns Array of all providers with live instances
   */
  public getProviders(): IDiscoveryProvider[] {
    const wrappers = this.discoveryService.getProviders();
    return this.wrapProviders(wrappers);
  }

  /**
   * Get providers whose metatype has a specific metadata key.
   *
   * Iterates all providers and checks each metatype for the given metadata
   * key using `@vivtel/metadata`'s `getMetadata`. Returns only providers
   * where the metadata value is truthy.
   *
   * @param key - The metadata key to filter by (string or symbol)
   * @returns Array of matching providers
   */
  public getProvidersByMetadata(key: string | symbol): IDiscoveryProvider[] {
    const allProviders = this.getProviders();

    return allProviders.filter((provider) => {
      if (!provider.metatype) return false;
      const meta = getMetadata(key, provider.metatype);
      return meta !== undefined && meta !== null;
    });
  }

  /**
   * Get every module CLASS currently registered in the container.
   *
   * Iterates the module registry, drops modules whose metatype is missing
   * (rare — happens for anonymous dynamic modules the container assembled
   * from an object literal), de-duplicates by reference so a module
   * imported twice in the graph appears once, and returns the resulting
   * class list.
   *
   * The caller uses `typeof (M as any).methodName === 'function'` to
   * probe for static-method manifest hooks (`configurePublishables`,
   * future `configureSchedule`, ...) — this method is deliberately un-
   * opinionated about which method the caller probes for, so the same
   * seam serves every future module-level manifest loader.
   *
   * @returns Every module class currently registered — de-duplicated,
   *   order not guaranteed.
   */
  public getModules(): readonly Type<unknown>[] {
    // Bucket-uniqueness: the same module class can appear under multiple
    // tokens (e.g. a global module imported by many features). We collect
    // into a Set keyed on the class reference itself.
    const uniq = new Set<Type<unknown>>();

    for (const module of this.modulesContainer.getModules().values()) {
      const metatype = module.metatype;
      // Anonymous dynamic modules may have no metatype — skip them; the
      // caller expects a real class ref it can probe for static methods.
      if (!metatype) continue;
      uniq.add(metatype as Type<unknown>);
    }

    return [...uniq];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Normalize InstanceWrapper[] into IDiscoveryProvider[].
   *
   * Filters out wrappers without live instances (unresolved providers)
   * and maps each to the uniform IDiscoveryProvider shape.
   *
   * @param wrappers - Raw instance wrappers from the container
   * @returns Normalized discovery providers
   */
  private wrapProviders(wrappers: InstanceWrapper[]): IDiscoveryProvider[] {
    const result: IDiscoveryProvider[] = [];

    for (const wrapper of wrappers) {
      const instance = wrapper.instance;
      const metatype = wrapper.metatype ?? null;

      // Skip unresolved or non-class providers
      if (!instance) continue;

      result.push({
        instance,
        metatype,
        name: wrapper.name ?? metatype?.name ?? "unknown",
        token: wrapper.token,
      });
    }

    return result;
  }
}
