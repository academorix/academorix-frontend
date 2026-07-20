/**
 * @file widget-cohort.registry.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link WidgetCohortRegistry}.
 */

import { describe, expect, it } from "vitest";

import { DuplicateWidgetCohortError, InvalidWidgetMetadataError } from "@/core";
import type { IWidgetCohortEntry } from "@/core/interfaces/widget-cohort-entry.interface";
import { WidgetCohortRegistry } from "@/core/registries/widget-cohort.registry";

function makeCohort(overrides: Partial<IWidgetCohortEntry> = {}): IWidgetCohortEntry {
  return {
    key: "numbers",
    label: "Numbers",
    description: "Single-metric KPI cards with sparklines.",
    icon: "square-chart-bar",
    ...overrides,
  };
}

describe("WidgetCohortRegistry", () => {
  it("registers a cohort entry and returns it via get()", () => {
    const registry = new WidgetCohortRegistry();
    const cohort = makeCohort();

    registry.register(cohort);

    expect(registry.get("numbers")).toBe(cohort);
  });

  it("throws DuplicateWidgetCohortError on duplicate keys", () => {
    const registry = new WidgetCohortRegistry();

    registry.register(makeCohort({ key: "numbers" }));

    expect(() => registry.register(makeCohort({ key: "numbers", label: "Other" }))).toThrow(
      DuplicateWidgetCohortError,
    );
  });

  it("allows replace() to override an existing cohort", () => {
    const registry = new WidgetCohortRegistry();
    const first = makeCohort({ label: "First" });
    const second = makeCohort({ label: "Second" });

    registry.register(first);
    registry.replace(first.key, second);

    expect(registry.get("numbers")?.label).toBe("Second");
  });

  it.each([
    ["Numbers", "uppercase disallowed"],
    ["num_bers", "underscore disallowed"],
    ["1numbers", "must start with a letter"],
    ["", "empty string"],
  ])("rejects the malformed key '%s' (%s)", (badKey) => {
    const registry = new WidgetCohortRegistry();

    expect(() => registry.register(makeCohort({ key: badKey }))).toThrow(
      InvalidWidgetMetadataError,
    );
  });

  it("rejects a cohort with an empty label", () => {
    const registry = new WidgetCohortRegistry();

    expect(() => registry.register(makeCohort({ label: "" }))).toThrow(InvalidWidgetMetadataError);
  });

  it("rejects a cohort with an empty description", () => {
    const registry = new WidgetCohortRegistry();

    expect(() => registry.register(makeCohort({ description: "" }))).toThrow(
      InvalidWidgetMetadataError,
    );
  });

  it("rejects a cohort with an empty icon", () => {
    const registry = new WidgetCohortRegistry();

    expect(() => registry.register(makeCohort({ icon: "" }))).toThrow(InvalidWidgetMetadataError);
  });

  it("iterates cohorts in insertion order via values()", () => {
    const registry = new WidgetCohortRegistry();

    registry.register(makeCohort({ key: "numbers" }));
    registry.register(makeCohort({ key: "charts", label: "Charts", icon: "chart-column" }));
    registry.register(makeCohort({ key: "calendar", label: "Calendar", icon: "clock" }));

    expect(registry.values().map((entry) => entry.key)).toEqual(["numbers", "charts", "calendar"]);
  });
});
