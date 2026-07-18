/**
 * @file discovery.module.ts
 * @module @stackra/container/core/discovery
 * @description Global module that exposes `DiscoveryService`.
 *
 *   Import once at the root and the service is available everywhere:
 *
 *   ```typescript
 *   @Module({ imports: [DiscoveryModule] })
 *   class AppModule {}
 *   ```
 *
 *   Mirrors NestJS's `DiscoveryModule` at
 *   `packages/core/discovery/discovery-module.ts`.
 *
 *   Also registers `ContainerDiscoveryService` bound to the
 *   `DISCOVERY_SERVICE` token from `@stackra/contracts`, enabling any
 *   package to inject the platform-agnostic discovery service via
 *   `@Inject(DISCOVERY_SERVICE)`.
 */

import { DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IPublishableConsumer } from "@stackra/contracts";
import { Path } from "@stackra/support";

import { Global } from "@/core/decorators/global.decorator";
import { Module } from "@/core/decorators/module.decorator";

import { ContainerDiscoveryService } from "./container-discovery.service";
import { DiscoveryService } from "./discovery.service";

/**
 * Global module exporting {@link DiscoveryService} and
 * {@link ContainerDiscoveryService}.
 *
 * The service depends on `ModuleContainer`, which
 * `ApplicationFactory.create()` registers as a value provider on every
 * module — so `DiscoveryModule` can be imported anywhere without extra
 * wiring.
 *
 * Binds `DISCOVERY_SERVICE` token to `ContainerDiscoveryService` so that
 * loader services (`ReporterLoader`, `CacheStoreLoader`, …) can inject
 * it platform-agnostically.
 *
 * Also serves as the container package's publishable-manifest owner —
 * DiscoveryModule is the practical entry point every consumer imports
 * from `@stackra/container` at their AppModule level, so it hosts the
 * static `configurePublishables()` for the package's two reference
 * config templates (`application.config.ts`, `container.config.ts`).
 */
@Global()
@Module({
  providers: [
    DiscoveryService,
    ContainerDiscoveryService,
    { provide: DISCOVERY_SERVICE, useExisting: ContainerDiscoveryService },
  ],
  exports: [DiscoveryService, ContainerDiscoveryService, DISCOVERY_SERVICE],
})
export class DiscoveryModule {
  /**
   * Absolute path to the `@stackra/container` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `PublishableConsumer` can auto-read it and fill in `packageRoot`
   * on every `.publish(entry)` call.
   *
   * `3` walk-ups from
   * `packages/container/src/core/discovery/discovery.module.ts`
   * (dirname is `.../src/core/discovery`) reach `packages/container/`
   * — one level deeper than the canonical `src/core/*.module.ts`
   * layout because this file sits inside a `discovery/` subdomain.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url, 3);

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/container` owns.
   *
   * The container package ships two reference configs — one for the
   * `ApplicationFactory.create(RootModule, options)` call site
   * (`application.config.ts`) and one for the container runtime itself
   * (`container.config.ts`). Consumers publish each separately.
   *
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above.
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer
      .publish({
        tag: "container-application-config",
        description: "Reference ApplicationFactory.create() options for the app.",
        files: ["config/application.config.ts"],
      })
      .publish({
        tag: "container-config",
        description: "Reference @stackra/container runtime config for the app.",
        files: ["config/container.config.ts"],
      });
  }
}
