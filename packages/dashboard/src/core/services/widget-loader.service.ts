/**
 * @file widget-loader.service.ts
 * @module @stackra/dashboard/core/services
 * @description Auto-discovers `@Widget()`-decorated classes during the
 *   `OnApplicationBootstrap` phase using the `DISCOVERY_SERVICE`
 *   pattern.
 *
 *   Follows the naming + timing conventions codified in
 *   `.kiro/steering/discovery-vs-loader.md`:
 *
 *   - Filename `*-loader.service.ts`, class `WidgetLoader` (no
 *     `Service` suffix on the class).
 *   - Depends only on the `DISCOVERY_SERVICE` contract — never on
 *     the concrete `ContainerDiscoveryService`.
 *   - Runs at `OnApplicationBootstrap` (never `OnModuleInit`) — the
 *     module graph must be fully settled before we walk it.
 *
 *   For each provider carrying the {@link WIDGET_METADATA_KEY}:
 *
 *   1. Skip if `metatype` is missing (factory-provided; opaque to us).
 *   2. Skip with a `console.warn` if `instance instanceof BaseWidget`
 *      fails — the class was decorated but not extending the base is
 *      a fail-soft misconfiguration.
 *   3. Read metadata via {@link readWidgetMetadata}; skip if absent
 *      (defensive — the discovery service returned a match on the
 *      metadata key, so absence would be a discovery bug).
 *   4. Build a fully-formed {@link IRegisteredWidget} whose renderer
 *      is bound to the container-managed instance.
 *   5. Register through {@link WidgetCatalogueService.registerWidget}
 *      so the cross-cohort check fires, then register the renderer
 *      into {@link WidgetRendererRegistry}.
 */

import { Inject, Injectable, type OnApplicationBootstrap } from "@stackra/container";
import { DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IDiscoveryService, Type } from "@stackra/contracts";

import { BaseWidget } from "@/core/base/base-widget.provider";
import type { IRegisteredWidget } from "@/core/interfaces/registered-widget.interface";
import type { IWidgetProvider } from "@/core/interfaces/widget-provider.interface";
import { readWidgetMetadata } from "@/core/metadata/widget.metadata";
import { WIDGET_METADATA_KEY } from "@/core/constants/widget-metadata-key.constants";
import { WidgetRendererRegistry } from "@/core/registries/widget-renderer.registry";

import { WidgetCatalogueService } from "./widget-catalogue.service";

/**
 * Discovery-driven loader that populates the widget + renderer
 * registries at application bootstrap.
 *
 * Consumers never touch this directly — `DashboardModule.forRoot()`
 * wires it in and the container drives the lifecycle. The loader
 * relies on the platform-agnostic `DISCOVERY_SERVICE` contract so it
 * works identically under the container's reflection-based discovery
 * + any future build-time-manifest discovery implementation.
 */
@Injectable()
export class WidgetLoader implements OnApplicationBootstrap {
  /**
   * @param discovery - Platform-agnostic discovery service.
   * @param catalogue - Orchestrator that owns the cross-cohort
   *   validation on widget register.
   * @param renderers - Renderer registry — receives the bound
   *   `instance.render` on every successful discovery.
   */
  public constructor(
    @Inject(DISCOVERY_SERVICE) private readonly discovery: IDiscoveryService,
    private readonly catalogue: WidgetCatalogueService,
    private readonly renderers: WidgetRendererRegistry,
  ) {}

  /**
   * Discover and register every `@Widget()`-decorated provider.
   *
   * Runs once after every module has finished `OnModuleInit`. Every
   * malformed provider fails soft with a `console.warn` — a bad
   * class shouldn't take down every other widget's registration.
   * Duplicate-key + validation errors still bubble up because those
   * are authored errors that must be surfaced loud.
   */
  public onApplicationBootstrap(): void {
    const providers = this.discovery.getProvidersByMetadata(WIDGET_METADATA_KEY);

    for (const provider of providers) {
      const { instance, metatype: rawMetatype, name } = provider;

      // Factory-provided or otherwise class-less registrations —
      // opaque to a metadata-driven discovery loader.
      if (!rawMetatype) continue;

      // Narrow the discovery contract's `Function | null` to the
      // workspace's `Type<unknown>` constructor-ref shape. Safe by
      // construction: `getProvidersByMetadata` only returns
      // providers whose class carried metadata, and only class
      // constructors carry metadata via `@vivtel/metadata`.
      const metatype = rawMetatype as Type<unknown>;

      // Every widget MUST extend `BaseWidget` so `render(context)`
      // exists and the dispatch component can safely invoke it.
      // Log-and-skip rather than throw — a misconfigured class is
      // an authoring error, but killing the whole loader would
      // hide the actual cause behind a stack trace.
      if (!(instance instanceof BaseWidget)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[stackra/dashboard] Skipping @Widget class "${name}": instance does not ` +
            `extend BaseWidget. Every @Widget()-decorated class must \`extends BaseWidget\`.`,
        );
        continue;
      }

      // Read back the metadata `@Widget()` stamped on the class.
      // Absence at this point would indicate a discovery bug — the
      // provider was returned as a match on WIDGET_METADATA_KEY —
      // but we defensively skip rather than throw.
      const metadata = readWidgetMetadata(metatype);
      if (!metadata) {
        // eslint-disable-next-line no-console
        console.warn(
          `[stackra/dashboard] Skipping "${name}": ` +
            `@vivtel/metadata could not read @Widget() metadata off the class.`,
        );
        continue;
      }

      // Bind the render method to the instance so the dispatch
      // component can call the renderer as a plain function without
      // losing `this`.
      const widgetInstance = instance as IWidgetProvider;
      const boundRenderer = widgetInstance.render.bind(widgetInstance);

      const entry: IRegisteredWidget = {
        metadata,
        classRef: metatype,
        instance: widgetInstance,
        renderer: boundRenderer,
      };

      // Register through the orchestrator so the cross-cohort
      // check fires (unknown cohort → InvalidWidgetMetadataError).
      this.catalogue.registerWidget(entry);

      // Register the renderer separately. Uses `replace()` so a
      // widget class re-registered after `forFeature` renderer
      // bindings don't clash — the class-level binding always wins.
      this.renderers.replace(metadata.key, boundRenderer);
    }
  }
}
