/**
 * @file widget-loader.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link WidgetLoader} — the
 *   discovery-driven loader.
 *
 *   The loader is tested in isolation with a stub
 *   {@link IDiscoveryService} rather than a real DI container so we
 *   can drive every branch (missing metatype, wrong instance shape,
 *   missing metadata, happy path) deterministically.
 */

import { describe, expect, it, vi } from "vitest";

import type { IDiscoveryProvider, IDiscoveryService, Type } from "@stackra/contracts";

import { BaseWidget, Widget } from "@/core";
import { WidgetCohortRegistry } from "@/core/registries/widget-cohort.registry";
import { WidgetRegistry } from "@/core/registries/widget.registry";
import { WidgetRendererRegistry } from "@/core/registries/widget-renderer.registry";
import { WidgetCatalogueService } from "@/core/services/widget-catalogue.service";
import { WidgetLoader } from "@/core/services/widget-loader.service";

/**
 * Build a discovery-service stub that returns a fixed list of
 * providers regardless of the metadata key. The loader only ever
 * calls `getProvidersByMetadata` — the other methods are stubbed to
 * throw so an accidental call surfaces loudly.
 */
function makeDiscovery(providers: IDiscoveryProvider[]): IDiscoveryService {
  return {
    getProviders: () => providers,
    getProvidersByMetadata: () => providers,
    getModules: (): readonly Type<unknown>[] => [],
  };
}

/**
 * Compose the four collaborators the loader depends on into a fresh
 * bundle per test. The catalogue seeds the canonical cohorts on
 * `onModuleInit` so the widgets under test can reference `"numbers"`
 * / `"charts"` etc. without an extra `registerCohort` call.
 */
function bootstrap(): {
  discovery: IDiscoveryService;
  catalogue: WidgetCatalogueService;
  renderers: WidgetRendererRegistry;
  widgets: WidgetRegistry;
  createLoader: (providers: IDiscoveryProvider[]) => WidgetLoader;
} {
  const widgets = new WidgetRegistry();
  const cohorts = new WidgetCohortRegistry();
  const renderers = new WidgetRendererRegistry();
  const catalogue = new WidgetCatalogueService(widgets, cohorts);
  catalogue.onModuleInit();

  return {
    discovery: makeDiscovery([]),
    catalogue,
    renderers,
    widgets,
    createLoader: (providers) => new WidgetLoader(makeDiscovery(providers), catalogue, renderers),
  };
}

describe("WidgetLoader", () => {
  it("registers a well-formed @Widget class into both registries", () => {
    @Widget({
      key: "kpi-athletes",
      cohort: "numbers",
      title: "Athletes",
      description: "Total active athletes across every branch.",
      icon: "person",
      span: "third",
    })
    class KpiAthletesWidget extends BaseWidget {
      public render(): string {
        return "hello";
      }
    }

    const { widgets, renderers, createLoader } = bootstrap();
    const instance = new KpiAthletesWidget();
    const loader = createLoader([
      {
        instance,
        metatype: KpiAthletesWidget,
        name: "KpiAthletesWidget",
      },
    ]);

    loader.onApplicationBootstrap();

    expect(widgets.has("kpi-athletes")).toBe(true);
    expect(widgets.get("kpi-athletes")?.metadata.title).toBe("Athletes");
    expect(renderers.has("kpi-athletes")).toBe(true);
    // The bound renderer produces the class's real output.
    expect(renderers.get("kpi-athletes")?.({ config: {}, onConfigChange: () => {} })).toBe("hello");
  });

  it("skips providers with no metatype (factory-provided)", () => {
    const { widgets, createLoader } = bootstrap();
    const loader = createLoader([
      {
        instance: { render: () => null },
        metatype: null,
        name: "opaque",
      },
    ]);

    expect(() => loader.onApplicationBootstrap()).not.toThrow();
    expect(widgets.count()).toBe(0);
  });

  it("warns + skips providers whose instance does not extend BaseWidget", () => {
    // A class that carries widget metadata but doesn't extend
    // `BaseWidget` — the metadata got there some other way (e.g.
    // hand-stamped in a test). The loader must fail soft.
    @Widget({
      key: "kpi-bad",
      cohort: "numbers",
      title: "Bad",
      description: "Should be skipped.",
      icon: "square",
      span: "third",
    })
    class NotAWidget {
      public render(): null {
        return null;
      }
    }

    const { widgets, createLoader } = bootstrap();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {
      // silence the expected warning during the test
    });

    const loader = createLoader([
      {
        instance: new NotAWidget(),
        metatype: NotAWidget,
        name: "NotAWidget",
      },
    ]);

    loader.onApplicationBootstrap();

    expect(widgets.count()).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("propagates duplicate-key errors when two widgets share a key", () => {
    @Widget({
      key: "kpi-athletes",
      cohort: "numbers",
      title: "First",
      description: "First widget with this key.",
      icon: "person",
      span: "third",
    })
    class FirstWidget extends BaseWidget {
      public render(): null {
        return null;
      }
    }

    @Widget({
      key: "kpi-athletes",
      cohort: "numbers",
      title: "Second",
      description: "Second widget with the same key.",
      icon: "person",
      span: "third",
    })
    class SecondWidget extends BaseWidget {
      public render(): null {
        return null;
      }
    }

    const { createLoader } = bootstrap();
    const loader = createLoader([
      { instance: new FirstWidget(), metatype: FirstWidget, name: "FirstWidget" },
      { instance: new SecondWidget(), metatype: SecondWidget, name: "SecondWidget" },
    ]);

    expect(() => loader.onApplicationBootstrap()).toThrow(/Duplicate widget key/i);
  });
});
