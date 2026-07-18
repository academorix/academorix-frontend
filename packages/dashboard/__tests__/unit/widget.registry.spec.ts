/**
 * @file widget.registry.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link WidgetRegistry} — the metadata
 *   registry.
 *
 *   Focuses on the registry's own contract: strict-register semantics,
 *   kebab-case key validation, per-field validation, and duplicate-
 *   error factory. Cross-cohort validation is the orchestrator's job
 *   and is covered in the catalogue spec.
 */

import { describe, expect, it } from "vitest";

import type { Type } from "@stackra/contracts";

import { DuplicateWidgetKeyError, InvalidWidgetMetadataError } from "@/core";
import type { IRegisteredWidget } from "@/core/interfaces/registered-widget.interface";
import { WidgetRegistry } from "@/core/registries/widget.registry";

// Test-only stand-in — the registry doesn't care what the class ref
// looks like beyond `.name`, so a fresh anonymous constructor per
// entry is enough to surface the class name in duplicate errors.
function makeEntry(overrides: Partial<IRegisteredWidget["metadata"]> = {}): IRegisteredWidget {
  const metadata = {
    key: "kpi-athletes",
    cohort: "numbers",
    title: "Athletes",
    description: "Total active athletes across every branch.",
    icon: "person",
    span: "third" as const,
    ...overrides,
  };
  const classRef = { [`Widget:${metadata.key}`]: class {} }[
    `Widget:${metadata.key}`
  ] as Type<unknown>;
  const instance = { render: () => null };

  return {
    metadata,
    classRef,
    instance,
    renderer: () => null,
  };
}

describe("WidgetRegistry", () => {
  it("registers a widget entry and returns it via get()", () => {
    const registry = new WidgetRegistry();
    const entry = makeEntry();

    registry.register(entry);

    expect(registry.get(entry.metadata.key)).toBe(entry);
  });

  it("registers via the (key, entry) BaseRegistry-shaped overload", () => {
    const registry = new WidgetRegistry();
    const entry = makeEntry({ key: "kpi-events" });

    registry.register(entry.metadata.key, entry);

    expect(registry.get("kpi-events")).toBe(entry);
  });

  it("throws DuplicateWidgetKeyError on second registration of the same key", () => {
    const registry = new WidgetRegistry();
    const first = makeEntry({ key: "kpi-athletes", title: "First" });
    const second = makeEntry({ key: "kpi-athletes", title: "Second" });

    registry.register(first);

    expect(() => registry.register(second)).toThrow(DuplicateWidgetKeyError);
  });

  it("allows explicit replace() to overwrite an existing key", () => {
    const registry = new WidgetRegistry();
    const first = makeEntry({ key: "kpi-athletes", title: "First" });
    const second = makeEntry({ key: "kpi-athletes", title: "Second" });

    registry.register(first);
    registry.replace(first.metadata.key, second);

    expect(registry.get("kpi-athletes")).toBe(second);
  });

  it.each([
    ["Kpi-Athletes", "uppercase disallowed"],
    ["kpi_athletes", "underscore disallowed"],
    ["1kpi", "must start with a letter"],
    ["-kpi", "leading hyphen disallowed"],
    ["kpi--athletes", "consecutive hyphens disallowed"],
    ["", "empty string"],
  ])("rejects the malformed key '%s' (%s)", (badKey) => {
    const registry = new WidgetRegistry();
    const entry = makeEntry({ key: badKey });

    expect(() => registry.register(entry)).toThrow(InvalidWidgetMetadataError);
  });

  it("rejects an entry with an empty title", () => {
    const registry = new WidgetRegistry();
    const entry = makeEntry({ title: "" });

    expect(() => registry.register(entry)).toThrow(InvalidWidgetMetadataError);
  });

  it("rejects an entry with an empty description", () => {
    const registry = new WidgetRegistry();
    const entry = makeEntry({ description: "" });

    expect(() => registry.register(entry)).toThrow(InvalidWidgetMetadataError);
  });

  it("rejects an entry with an empty cohort", () => {
    const registry = new WidgetRegistry();
    const entry = makeEntry({ cohort: "" });

    expect(() => registry.register(entry)).toThrow(InvalidWidgetMetadataError);
  });

  it("rejects an entry with an unknown span value", () => {
    const registry = new WidgetRegistry();
    const entry = makeEntry({ span: "quarter" as unknown as "full" });

    expect(() => registry.register(entry)).toThrow(InvalidWidgetMetadataError);
  });

  it("names both offenders in the duplicate error", () => {
    const registry = new WidgetRegistry();
    const first = makeEntry({ key: "kpi-athletes" });
    const second = makeEntry({ key: "kpi-athletes" });

    // Force distinct-named classRefs so we can assert both appear.
    Object.defineProperty(first.classRef, "name", { value: "FirstWidget" });
    Object.defineProperty(second.classRef, "name", { value: "SecondWidget" });

    registry.register(first);

    try {
      registry.register(second);
      throw new Error("expected register to throw");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(err).toBeInstanceOf(DuplicateWidgetKeyError);
      expect(message).toContain("FirstWidget");
      expect(message).toContain("SecondWidget");
    }
  });

  it("count() reflects the number of registered entries", () => {
    const registry = new WidgetRegistry();

    expect(registry.count()).toBe(0);

    registry.register(makeEntry({ key: "kpi-athletes" }));
    registry.register(makeEntry({ key: "kpi-events" }));

    expect(registry.count()).toBe(2);
  });
});
