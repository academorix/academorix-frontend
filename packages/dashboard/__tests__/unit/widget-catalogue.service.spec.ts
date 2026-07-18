/**
 * @file widget-catalogue.service.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link WidgetCatalogueService} — the
 *   thin orchestrator over the widget + cohort registries.
 *
 *   Focuses on the orchestrator's own behaviour: seeding the
 *   canonical cohorts on `onModuleInit`, seeding config-declared
 *   cohorts + widgets, cross-cohort validation on `registerWidget`,
 *   and the projection helpers (`spanFor`, `defaultLayout`,
 *   `widgetsByCohort`). Registry-level contracts (duplicate errors,
 *   key shape) are covered in the per-registry specs.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { InvalidWidgetMetadataError } from "@/core";
import type { IWidgetEntry } from "@/core/interfaces/widget-entry.interface";
import { WidgetCohortRegistry } from "@/core/registries/widget-cohort.registry";
import { WidgetRegistry } from "@/core/registries/widget.registry";
import { WidgetCatalogueService } from "@/core/services/widget-catalogue.service";

function makeEntry(overrides: Partial<IWidgetEntry> = {}): IWidgetEntry {
  return {
    key: "kpi-athletes",
    cohort: "numbers",
    title: "Athletes",
    description: "Total active athletes across every branch.",
    icon: "person",
    span: "third",
    ...overrides,
  };
}

describe("WidgetCatalogueService", () => {
  let widgetRegistry: WidgetRegistry;
  let cohortRegistry: WidgetCohortRegistry;
  let catalogue: WidgetCatalogueService;

  beforeEach(() => {
    // Fresh registry pair per test — no shared state, no `.reset()`.
    widgetRegistry = new WidgetRegistry();
    cohortRegistry = new WidgetCohortRegistry();
    catalogue = new WidgetCatalogueService(widgetRegistry, cohortRegistry);
    // Drive the lifecycle by hand — the DI container isn't running.
    catalogue.onModuleInit();
  });

  it("seeds the canonical cohorts on module init", () => {
    const keys = catalogue.listCohorts().map((entry) => entry.key);

    expect(keys).toContain("numbers");
    expect(keys).toContain("charts");
    expect(keys).toContain("compliance");
  });

  it("registers widgets that reference known cohorts", () => {
    catalogue.registerWidget(makeEntry({ key: "kpi-athletes" }));

    expect(catalogue.findWidget("kpi-athletes")?.key).toBe("kpi-athletes");
  });

  it("throws InvalidWidgetMetadataError when a widget references an unknown cohort", () => {
    expect(() => catalogue.registerWidget(makeEntry({ cohort: "nonexistent" }))).toThrow(
      InvalidWidgetMetadataError,
    );
  });

  it("throws on duplicate widget key registrations (via the underlying registry)", () => {
    catalogue.registerWidget(makeEntry({ key: "kpi-athletes" }));

    expect(() => catalogue.registerWidget(makeEntry({ key: "kpi-athletes" }))).toThrow(
      /Duplicate widget key/i,
    );
  });

  it("registerCohort adds a new cohort", () => {
    catalogue.registerCohort({
      key: "custom",
      label: "Custom",
      description: "Third-party bucket.",
      icon: "square",
    });

    expect(catalogue.listCohorts().some((entry) => entry.key === "custom")).toBe(true);
  });

  it("re-seeding on onModuleInit replaces canonical cohorts (idempotent boot)", () => {
    // Boot again — replaces cohorts (not registers) so no duplicate
    // error surfaces and the registry stays consistent.
    expect(() => catalogue.onModuleInit()).not.toThrow();
    expect(catalogue.listCohorts().length).toBeGreaterThan(0);
  });

  it("falls back to `third` for spans on unknown widget keys", () => {
    expect(catalogue.spanFor("nonexistent")).toBe("third");
  });

  it("returns defaultLayout keys for widgets marked `defaultEnabled`", () => {
    catalogue.registerWidget(makeEntry({ key: "on-1", defaultEnabled: true }));
    catalogue.registerWidget(makeEntry({ key: "off-1" }));
    catalogue.registerWidget(makeEntry({ key: "on-2", defaultEnabled: true }));

    expect(catalogue.defaultLayout()).toEqual(["on-1", "on-2"]);
  });

  it("groups widgets by cohort in cohort-registration order", () => {
    catalogue.registerWidget(makeEntry({ key: "a", cohort: "numbers" }));
    catalogue.registerWidget(makeEntry({ key: "b", cohort: "charts" }));

    const groups = catalogue.widgetsByCohort();
    const numbers = groups.find((entry) => entry.cohort === "numbers");
    const charts = groups.find((entry) => entry.cohort === "charts");

    expect(numbers?.widgets.map((entry) => entry.key)).toContain("a");
    expect(charts?.widgets.map((entry) => entry.key)).toContain("b");
  });

  it("listWidgets returns entries in insertion order", () => {
    catalogue.registerWidget(makeEntry({ key: "first" }));
    catalogue.registerWidget(makeEntry({ key: "second" }));
    catalogue.registerWidget(makeEntry({ key: "third" }));

    expect(catalogue.listWidgets().map((entry) => entry.key)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("seeds cohorts + widgets from injected config on onModuleInit", () => {
    // Fresh instance to observe the seeding path — the outer
    // beforeEach used a config-less instance.
    const w = new WidgetRegistry();
    const c = new WidgetCohortRegistry();
    const seed = new WidgetCatalogueService(w, c, {
      storage: { ownerId: "test", tenantId: "test" },
      cohorts: [
        {
          key: "custom-cohort",
          label: "Custom",
          description: "d",
          icon: "square",
        },
      ],
      widgets: [makeEntry({ key: "config-widget", cohort: "custom-cohort" })],
    });

    seed.onModuleInit();

    expect(c.has("custom-cohort")).toBe(true);
    expect(w.has("config-widget")).toBe(true);
  });
});
