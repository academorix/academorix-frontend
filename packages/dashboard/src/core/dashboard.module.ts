/**
 * @file dashboard.module.ts
 * @module @stackra/dashboard/core/module
 * @description The composite `DashboardModule` — the DI module every
 *   consumer imports.
 *
 *   `forRoot(options)` wires the storage adapter + widget catalogue +
 *   the three registries + the discovery loader globally.
 *   `forRootAsync(options)` mirrors the same shape for factory-based
 *   config.
 *   `forFeature(options)` accepts a batch of widget / cohort /
 *   renderer entries and seeds them via `createSeedLoader` — per the
 *   module-lifecycle steering, never via a side-effecting factory.
 */

import { Module, type DynamicModule } from "@stackra/container";
import type { IAsyncModuleOptions } from "@stackra/contracts";
import { createSeedLoader, Path, seedLoaderToken } from "@stackra/support";

import { WidgetCohortRegistry } from "@/core/registries/widget-cohort.registry";
import { WidgetRegistry } from "@/core/registries/widget.registry";
import { WidgetRendererRegistry } from "@/core/registries/widget-renderer.registry";
import { DashboardStorageService } from "@/core/services/dashboard-storage.service";
import { WidgetCatalogueService } from "@/core/services/widget-catalogue.service";
import { WidgetLoader } from "@/core/services/widget-loader.service";
import { DASHBOARD_CONFIG } from "@/core/tokens/dashboard-config.token";
import { DASHBOARD_STORAGE } from "@/core/tokens/dashboard-storage.token";
import { WIDGET_CATALOGUE_SERVICE } from "@/core/tokens/widget-catalogue.token";
import { WIDGET_COHORT_REGISTRY } from "@/core/tokens/widget-cohort-registry.token";
import { WIDGET_REGISTRY } from "@/core/tokens/widget-registry.token";
import { WIDGET_RENDERER_REGISTRY } from "@/core/tokens/widget-renderer-registry.token";
import { mergeConfig } from "@/core/utils/merge-config.util";

import type { IWidgetCohortEntry } from "@/core/interfaces/widget-cohort-entry.interface";
import type { IWidgetEntry } from "@/core/interfaces/widget-entry.interface";
import type { WidgetRenderer } from "@/core/types/widget-renderer.type";

import type { IDashboardModuleOptions } from "./interfaces/dashboard-module-options.interface";

/**
 * Options accepted by {@link DashboardModule.forFeature}. Every field
 * is optional so a feature module can contribute widgets without
 * cohorts, cohorts without widgets, or renderer-only bundles.
 */
export interface IDashboardFeatureOptions {
  /** Feature name — used to scope the seed loader's token. */
  name: string;

  /** Additional widget cohorts to register. */
  cohorts?: readonly IWidgetCohortEntry[];

  /** Additional widgets to register. */
  widgets?: readonly IWidgetEntry[];

  /**
   * Additional renderer bindings — `(key, renderer)` tuples. Runs
   * on the same registration path as `WidgetRendererRegistry.
   * register(key, renderer)` — strict-by-default (collisions throw
   * {@link DuplicateWidgetRendererError}); reach for `.replace(...)`
   * if the intent is to override.
   */
  renderers?: readonly (readonly [string, WidgetRenderer])[];
}

/**
 * The composite dashboard module.
 *
 * @example
 * ```typescript
 * import { Module } from '@stackra/container';
 * import { DashboardModule } from '@stackra/dashboard';
 *
 * @Module({
 *   imports: [
 *     DashboardModule.forRoot({
 *       storage: { ownerId: 'user-42', tenantId: 'tenant-1' },
 *       widgets: [
 *         { key: 'kpi-athletes', cohort: 'numbers', title: 'Athletes',
 *           description: 'Total active athletes.', icon: 'person',
 *           span: 'third' },
 *       ],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class DashboardModule {
  /**
   * Absolute path to the `@stackra/dashboard` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * a future `PublishableConsumer` can auto-read it and fill in
   * `packageRoot` on every `.publish(entry)` call — mirrors the shape
   * `ConsoleModule.PACKAGE_ROOT` takes today.
   *
   * Auto-detect mode — walks up until a `package.json` is found.
   * Works uniformly across source (dev, tests) and dist builds
   * because it doesn't depend on the module file's directory depth.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  // ══════════════════════════════════════════════════════════════════════
  // forRoot
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Register the dashboard module globally with static config.
   *
   * @param options - Partial config; unset fields fall back to
   *   `DEFAULT_DASHBOARD_CONFIG`.
   * @returns Dynamic module definition.
   */
  public static forRoot(options?: Partial<IDashboardModuleOptions>): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: DashboardModule,
      global: true,
      providers: [
        // Config binding — every downstream service reads through this
        // token so tests can swap the config without patching services.
        { provide: DASHBOARD_CONFIG, useValue: config },

        // Widget metadata registry — populated by the loader from
        // discovery and by the catalogue service from config /
        // `forFeature` contributions.
        WidgetRegistry,
        { provide: WIDGET_REGISTRY, useExisting: WidgetRegistry },

        // Cohort registry — seeded by the catalogue service on
        // `onModuleInit` (canonical cohorts + any config-declared).
        WidgetCohortRegistry,
        { provide: WIDGET_COHORT_REGISTRY, useExisting: WidgetCohortRegistry },

        // Renderer registry — key → (context) => ReactNode. Populated
        // by the loader (`instance.render.bind(instance)` per widget
        // class) and by app-side bootstrap code for renderer-only
        // widgets.
        WidgetRendererRegistry,
        { provide: WIDGET_RENDERER_REGISTRY, useExisting: WidgetRendererRegistry },

        // Widget catalogue — thin orchestrator over the two
        // metadata registries; seeds itself from `DASHBOARD_CONFIG`
        // on `onModuleInit`.
        WidgetCatalogueService,
        { provide: WIDGET_CATALOGUE_SERVICE, useExisting: WidgetCatalogueService },

        // Discovery loader — populates both widget + renderer
        // registries from every `@Widget()`-decorated class in the
        // container at `onApplicationBootstrap`.
        WidgetLoader,

        // Storage adapter — the playground localStorage implementation.
        // Consumers who want an HTTP-backed adapter override
        // `DASHBOARD_STORAGE` in a downstream provider.
        DashboardStorageService,
        { provide: DASHBOARD_STORAGE, useExisting: DashboardStorageService },
      ],
      exports: [
        DASHBOARD_CONFIG,
        WIDGET_CATALOGUE_SERVICE,
        WidgetCatalogueService,
        WIDGET_REGISTRY,
        WidgetRegistry,
        WIDGET_COHORT_REGISTRY,
        WidgetCohortRegistry,
        WIDGET_RENDERER_REGISTRY,
        WidgetRendererRegistry,
        DASHBOARD_STORAGE,
        DashboardStorageService,
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // forRootAsync
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Register the dashboard module with an async factory for config.
   *
   * @param options - Async options — `useFactory` + optional `inject`.
   * @returns Dynamic module definition.
   */
  public static forRootAsync(
    options: IAsyncModuleOptions<IDashboardModuleOptions>,
  ): DynamicModule {
    return {
      module: DashboardModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DASHBOARD_CONFIG,
          // The factory result routes through `mergeConfig` so defaults
          // + normalisation happen in one place.
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },

        WidgetRegistry,
        { provide: WIDGET_REGISTRY, useExisting: WidgetRegistry },

        WidgetCohortRegistry,
        { provide: WIDGET_COHORT_REGISTRY, useExisting: WidgetCohortRegistry },

        WidgetRendererRegistry,
        { provide: WIDGET_RENDERER_REGISTRY, useExisting: WidgetRendererRegistry },

        WidgetCatalogueService,
        { provide: WIDGET_CATALOGUE_SERVICE, useExisting: WidgetCatalogueService },

        WidgetLoader,

        DashboardStorageService,
        { provide: DASHBOARD_STORAGE, useExisting: DashboardStorageService },
      ],
      exports: [
        DASHBOARD_CONFIG,
        WIDGET_CATALOGUE_SERVICE,
        WidgetCatalogueService,
        WIDGET_REGISTRY,
        WidgetRegistry,
        WIDGET_COHORT_REGISTRY,
        WidgetCohortRegistry,
        WIDGET_RENDERER_REGISTRY,
        WidgetRendererRegistry,
        DASHBOARD_STORAGE,
        DashboardStorageService,
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // forFeature
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Contribute widget / cohort / renderer entries from a feature
   * module.
   *
   * Seeding runs through `createSeedLoader(...)` — an
   * `onApplicationBootstrap` loader — so we honour the module
   * lifecycle rule (never a return-`true` side-effecting factory).
   *
   * Cohorts seed before widgets so contributions can freely
   * reference their own cohort keys. Widgets go through the
   * catalogue's `registerWidget(...)` (cross-cohort check), then
   * renderers use `WidgetRendererRegistry.register(key, renderer)`.
   *
   * @param options - Feature name + contribution lists.
   * @returns Dynamic module definition.
   */
  public static forFeature(options: IDashboardFeatureOptions): DynamicModule {
    return {
      module: DashboardModule,
      providers: [
        {
          // Fresh symbol per call — contributions from multiple
          // features never collide under the container's last-wins
          // token semantics.
          provide: seedLoaderToken(`dashboard-feature:${options.name}`),
          useFactory: (catalogue: WidgetCatalogueService, renderers: WidgetRendererRegistry) =>
            createSeedLoader(() => {
              for (const cohort of options.cohorts ?? []) {
                catalogue.registerCohort(cohort);
              }
              for (const widget of options.widgets ?? []) {
                catalogue.registerWidget(widget);
              }
              for (const [key, renderer] of options.renderers ?? []) {
                renderers.register(key, renderer);
              }
            }),
          inject: [WidgetCatalogueService, WidgetRendererRegistry],
        },
      ],
      exports: [],
    };
  }
}
