/**
 * @file widget-catalogue.service.ts
 * @module @stackra/dashboard/core/services
 * @description Thin orchestrator over {@link WidgetRegistry} +
 *   {@link WidgetCohortRegistry}. Consumers talk to the catalogue
 *   service; the two registries stay pure state stores.
 *
 *   Seeds itself on `onModuleInit`:
 *
 *   1. Canonical cohorts from {@link DEFAULT_WIDGET_COHORTS} via
 *      {@link BaseRegistry.replace} — HMR + double-boot are both
 *      real scenarios where the same seed replays.
 *   2. Module-level cohort contributions from the injected config
 *      (strict `register`).
 *   3. Module-level widget contributions from the injected config
 *      (strict `register`, cross-cohort check enforced here).
 *
 *   Feature-module contributions land after boot via
 *   `DashboardModule.forFeature({ ... })` — same code path, just
 *   scheduled into `onApplicationBootstrap` by the seed loader.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { OnModuleInit, Type } from "@stackra/contracts";

import { DEFAULT_WIDGET_COHORTS } from "@/core/constants/widget-cohorts.constants";
import { InvalidWidgetMetadataError } from "@/core/errors/invalid-widget-metadata.error";
import type { IRegisteredWidget } from "@/core/interfaces/registered-widget.interface";
import type { IWidgetCohortEntry } from "@/core/interfaces/widget-cohort-entry.interface";
import type { IWidgetCohortGroup } from "@/core/interfaces/widget-cohort-group.interface";
import type { IWidgetEntry } from "@/core/interfaces/widget-entry.interface";
import type { IWidgetMetadata } from "@/core/interfaces/widget-metadata.interface";
import type { IDashboardModuleOptions } from "@/core/interfaces/dashboard-module-options.interface";
import { WidgetCohortRegistry } from "@/core/registries/widget-cohort.registry";
import { WidgetRegistry } from "@/core/registries/widget.registry";
import { DASHBOARD_CONFIG } from "@/core/tokens/dashboard-config.token";
import type { WidgetCohort } from "@/core/types/widget-cohort.type";
import type { WidgetSpan } from "@/core/types/widget-span.type";

/**
 * Orchestrator over the widget + cohort registries.
 *
 * The service intentionally owns no state of its own — every read /
 * write forwards to the injected registries. This keeps tests simple
 * (`new WidgetCatalogueService(widgetRegistry, cohortRegistry)`
 * against fresh instances per case) and the DI graph observable
 * (both registries are addressable via their own tokens).
 *
 * @example
 * ```typescript
 * import { useInject } from '@stackra/container/react';
 * import { WIDGET_CATALOGUE_SERVICE } from '@stackra/dashboard';
 *
 * const catalogue = useInject(WIDGET_CATALOGUE_SERVICE);
 * const groups = catalogue.widgetsByCohort();
 * ```
 */
@Injectable()
export class WidgetCatalogueService implements OnModuleInit {
  /**
   * @param widgets - Registry of registered widgets (keyed by
   *   catalogue key).
   * @param cohorts - Registry of registered cohorts.
   * @param config - Module-level config; cohort + widget
   *   contributions declared via `forRoot(...)` are seeded from here.
   */
  public constructor(
    private readonly widgets: WidgetRegistry,
    private readonly cohorts: WidgetCohortRegistry,
    @Optional()
    @Inject(DASHBOARD_CONFIG)
    private readonly config?: IDashboardModuleOptions,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Seed both registries from canonical defaults + module config.
   *
   * `replace()` on the canonical cohorts (not `register()`) so a
   * re-boot / HMR replay doesn't throw
   * {@link RegistryDuplicateError}; user contributions still use
   * strict `register()` so collisions fail loud.
   *
   * Cohorts before widgets so a widget can freely reference its own
   * cohort key from the same batch of contributions.
   */
  public onModuleInit(): void {
    for (const cohort of DEFAULT_WIDGET_COHORTS) {
      this.cohorts.replace(cohort.key, cohort);
    }
    for (const cohort of this.config?.cohorts ?? []) {
      this.registerCohort(cohort);
    }
    for (const widget of this.config?.widgets ?? []) {
      this.registerWidget(widget);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Registration
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register a widget contribution.
   *
   * Accepts either the historical config-shaped {@link IWidgetEntry}
   * (used by `forRoot({ widgets })` + `forFeature({ widgets })`) or a
   * fully-formed {@link IRegisteredWidget} (used by the loader after
   * discovery). Both shapes converge on the same underlying registry
   * call.
   *
   * @throws {InvalidWidgetMetadataError} When the entry references an
   *   unknown cohort — the widget registry can't cross-check on its
   *   own, so the orchestrator is where the check lives.
   */
  public registerWidget(entry: IWidgetEntry | IRegisteredWidget): void {
    const registered: IRegisteredWidget = isRegisteredWidget(entry)
      ? entry
      : this.wrapConfigEntry(entry);

    const cohortKey = registered.metadata.cohort;

    // Cross-registry check the widget registry can't do on its own.
    if (!this.cohorts.has(cohortKey)) {
      throw new InvalidWidgetMetadataError(
        "cohort",
        `references unknown cohort "${cohortKey}". Register the cohort first via ` +
          `DashboardModule.forRoot({ cohorts: [...] }) or DashboardModule.forFeature({ cohorts: [...] })`,
        registered.metadata.key,
      );
    }

    this.widgets.register(registered);
  }

  /**
   * Register a cohort contribution.
   */
  public registerCohort(entry: IWidgetCohortEntry): void {
    this.cohorts.register(entry);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Lookup
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Look up a widget entry by key.
   *
   * Returns the config-shaped {@link IWidgetEntry} so existing UI
   * consumers keep the same shape they've always seen. Consumers
   * that need the fuller {@link IRegisteredWidget} (with the class
   * ref + bound renderer) reach for {@link WidgetRegistry} directly.
   *
   * @param key - Widget catalogue key.
   * @returns The entry, or `undefined` when unknown.
   */
  public findWidget(key: string): IWidgetEntry | undefined {
    const entry = this.widgets.get(key);
    return entry ? WidgetCatalogueService.toWidgetEntry(entry.metadata) : undefined;
  }

  /**
   * Snapshot every registered widget in insertion order.
   *
   * @returns Read-only widget list.
   */
  public listWidgets(): readonly IWidgetEntry[] {
    return this.widgets.values().map((entry) => WidgetCatalogueService.toWidgetEntry(entry.metadata));
  }

  /**
   * Snapshot every registered cohort in insertion order.
   *
   * @returns Read-only cohort list.
   */
  public listCohorts(): readonly IWidgetCohortEntry[] {
    return this.cohorts.values();
  }

  /**
   * Get the widget span for a catalogue key. Falls back to `"third"`
   * for unknown keys — matches the storage layer's default so a
   * stale saved layout doesn't crash auto-layout.
   *
   * @param key - Widget catalogue key.
   * @returns The widget's declared span, or `"third"`.
   */
  public spanFor(key: string): WidgetSpan {
    return this.widgets.get(key)?.metadata.span ?? "third";
  }

  /**
   * Return the default enabled keys — used when the user has no
   * persisted layout.
   *
   * @returns Widget keys whose metadata has `defaultEnabled: true`,
   *   in registration order.
   */
  public defaultLayout(): string[] {
    return this.widgets
      .values()
      .filter((entry) => entry.metadata.defaultEnabled === true)
      .map((entry) => entry.metadata.key);
  }

  /**
   * Every registered widget grouped by its cohort, in cohort-
   * registration order.
   *
   * @returns Cohort groups suitable for rendering the picker.
   */
  public widgetsByCohort(): readonly IWidgetCohortGroup[] {
    return this.cohorts.values().map(({ key, label, description, icon }) => ({
      cohort: key as WidgetCohort,
      label,
      description,
      icon,
      widgets: this.widgets
        .values()
        .filter((entry) => entry.metadata.cohort === key)
        .map((entry) => WidgetCatalogueService.toWidgetEntry(entry.metadata)),
    }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Convert a config-shaped {@link IWidgetEntry} to a
   * {@link IRegisteredWidget}.
   *
   * Config-driven contributions don't have a class or a live
   * instance — they're plain metadata. We wrap them in a synthetic
   * `IRegisteredWidget` whose `classRef` names the anonymous origin
   * ("ConfigWidget:<key>") + whose `renderer` throws when called
   * (config-only widgets have no renderer of their own; the
   * app-side registers the renderer separately).
   */
  private wrapConfigEntry(entry: IWidgetEntry): IRegisteredWidget {
    const metadata: IWidgetMetadata = {
      key: entry.key,
      cohort: entry.cohort,
      title: entry.title,
      description: entry.description,
      icon: entry.icon,
      span: entry.span,
      ...(entry.defaultEnabled !== undefined ? { defaultEnabled: entry.defaultEnabled } : {}),
    };

    // Synthetic constructor-ref stand-in — the display name is what
    // duplicate-key errors surface, so we build a class-shaped
    // anonymous constructor whose `.name` reflects the origin.
    const configOrigin = { [`ConfigWidget:${entry.key}`]: class {} }[
      `ConfigWidget:${entry.key}`
    ] as Type<unknown>;

    // Config-only widgets have no runtime provider — the app is
    // expected to register a renderer through
    // `WidgetRendererRegistry.register(key, renderer)` alongside
    // this config entry. Calling `.render` on the synthetic
    // instance is a programmer error.
    const throwingRenderer = (): never => {
      throw new Error(
        `Widget "${entry.key}" was registered via config-only contribution ` +
          `(no @Widget class). Register a renderer via ` +
          `WidgetRendererRegistry.register("${entry.key}", ...) before rendering.`,
      );
    };

    return {
      metadata,
      classRef: configOrigin,
      instance: { render: throwingRenderer },
      renderer: throwingRenderer,
    };
  }

  /**
   * Convert an `IWidgetMetadata` back to the historical
   * `IWidgetEntry` shape used by every UI-side consumer.
   */
  private static toWidgetEntry(metadata: IWidgetMetadata): IWidgetEntry {
    return {
      key: metadata.key,
      cohort: metadata.cohort,
      title: metadata.title,
      description: metadata.description,
      icon: metadata.icon,
      span: metadata.span,
      ...(metadata.defaultEnabled !== undefined
        ? { defaultEnabled: metadata.defaultEnabled }
        : {}),
    };
  }
}

/**
 * Type guard — distinguishes a fully-formed `IRegisteredWidget` from
 * a config-shaped `IWidgetEntry`. The presence of the `metadata`
 * property + `classRef` is diagnostic; both are absent on the flat
 * config shape.
 */
function isRegisteredWidget(
  entry: IWidgetEntry | IRegisteredWidget,
): entry is IRegisteredWidget {
  return (
    typeof (entry as IRegisteredWidget).metadata === "object" &&
    (entry as IRegisteredWidget).metadata !== null &&
    typeof (entry as IRegisteredWidget).classRef === "function"
  );
}
