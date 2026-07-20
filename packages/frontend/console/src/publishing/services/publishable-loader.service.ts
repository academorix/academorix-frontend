/**
 * @file publishable-loader.service.ts
 * @module @stackra/console/publishing/services
 * @description Loader that populates `PublishableRegistry` at CLI boot.
 *
 *   Runs at `OnApplicationBootstrap` (never `OnModuleInit`) per
 *   `.kiro/steering/discovery-vs-loader.md` — the module graph must be
 *   fully settled before we iterate `IDiscoveryService.getModules()`.
 *
 *   For each module class, probes for a static `configurePublishables`
 *   method via `typeof` (interface-based type-guarding doesn't work on
 *   static methods in TypeScript). If present, constructs a fresh
 *   `PublishableConsumer` bound to the current module and invokes the
 *   method.
 */

import { Inject, Injectable, type OnApplicationBootstrap } from "@stackra/container";
import { DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IDiscoveryService, IPublishableConsumer, Type } from "@stackra/contracts";

import { PublishableConsumer } from "../publishable.consumer";
import { PublishableRegistry } from "../registries/publishable.registry";

/**
 * Structural shape the loader probes for on every module class.
 *
 * TypeScript can't statically check that a class conforms to
 * `IHasPublishables` (interfaces target instance methods, not statics),
 * so we describe the callable shape and duck-type at runtime.
 */
interface IModuleWithPublishables {
  configurePublishables?: (consumer: IPublishableConsumer) => void;
}

/**
 * Discovery-driven loader that populates `PublishableRegistry`.
 *
 * Consumers never touch this directly — `ConsoleModule.forRoot()` wires
 * it in, and `OnApplicationBootstrap` drives the scan.
 */
@Injectable()
export class PublishableLoader implements OnApplicationBootstrap {
  /**
   * @param discovery - Platform-agnostic discovery service. We use only
   *   `getModules()` — the provider-axis is irrelevant here because
   *   publishables live on module classes, not on providers.
   * @param registry - The target registry that receives every entry
   *   registered by module `configurePublishables()` methods.
   */
  public constructor(
    @Inject(DISCOVERY_SERVICE) private readonly discovery: IDiscoveryService,
    private readonly registry: PublishableRegistry,
  ) {}

  /**
   * Bootstrap-time scan. Walks every registered module class, probes
   * for `static configurePublishables`, and invokes it with a fresh
   * consumer.
   *
   * Any validation error thrown by `PublishableRegistry.register(...)`
   * propagates out of this hook — a bad publishable manifest is a
   * fail-loud misconfiguration that must stop the CLI boot before
   * `vendor:publish` runs against a half-registered registry.
   */
  public onApplicationBootstrap(): void {
    for (const ModuleClass of this.discovery.getModules()) {
      // Duck-type on the static side — TypeScript can't check the
      // static method against `IHasPublishables` at compile time, so
      // we describe the callable shape and probe by `typeof`.
      const withPublishables = ModuleClass as unknown as IModuleWithPublishables & Type<unknown>;
      const fn = withPublishables.configurePublishables;

      // Modules without publishables are the common case — silently
      // skip so a package that never ships files pays zero cost.
      if (typeof fn !== "function") continue;

      // Fresh consumer per module — pinning `sourceModule` inside the
      // consumer means `PublishableRegistry.register(...)` receives
      // correct attribution for every entry the module registers, no
      // matter how it chains its `.publish(...)` calls.
      const consumer = new PublishableConsumer(this.registry, ModuleClass);

      // Invoke the static — `.call(ModuleClass, ...)` keeps `this`
      // bound so a module that references sibling static helpers on
      // itself doesn't lose its `this` context.
      fn.call(ModuleClass, consumer);
    }
  }
}
