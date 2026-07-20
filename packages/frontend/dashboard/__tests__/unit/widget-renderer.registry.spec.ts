/**
 * @file widget-renderer.registry.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link WidgetRendererRegistry}.
 */

import { describe, expect, it } from "vitest";

import { DuplicateWidgetRendererError, InvalidWidgetMetadataError } from "@/core";
import { WidgetRendererRegistry } from "@/core/registries/widget-renderer.registry";

describe("WidgetRendererRegistry", () => {
  it("registers a renderer and returns it via get()", () => {
    const registry = new WidgetRendererRegistry();
    const renderer = (): string => "hello";

    registry.register("kpi-athletes", renderer);

    expect(registry.get("kpi-athletes")).toBe(renderer);
  });

  it("throws DuplicateWidgetRendererError on duplicate registrations", () => {
    const registry = new WidgetRendererRegistry();

    registry.register("kpi-athletes", () => "first");

    expect(() => registry.register("kpi-athletes", () => "second")).toThrow(
      DuplicateWidgetRendererError,
    );
  });

  it("allows explicit replace() to overwrite an existing renderer", () => {
    const registry = new WidgetRendererRegistry();

    registry.register("kpi-athletes", () => "first");
    const next = (): string => "second";
    registry.replace("kpi-athletes", next);

    expect(registry.get("kpi-athletes")).toBe(next);
  });

  it("returns undefined for unknown keys", () => {
    const registry = new WidgetRendererRegistry();
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("has() reflects registration state", () => {
    const registry = new WidgetRendererRegistry();

    expect(registry.has("kpi-athletes")).toBe(false);
    registry.register("kpi-athletes", () => null);
    expect(registry.has("kpi-athletes")).toBe(true);
  });

  it.each([
    ["Kpi-Athletes", "uppercase disallowed"],
    ["kpi_athletes", "underscore disallowed"],
    ["1kpi", "must start with a letter"],
    ["-kpi", "leading hyphen disallowed"],
    ["", "empty string"],
  ])("rejects the malformed key '%s' (%s)", (badKey) => {
    const registry = new WidgetRendererRegistry();

    expect(() => registry.register(badKey, () => null)).toThrow(InvalidWidgetMetadataError);
  });

  it("passes the context to the resolved renderer", () => {
    const registry = new WidgetRendererRegistry();
    const config = { foo: "bar" };

    registry.register("kpi-athletes", (ctx) => ctx.config);

    const renderer = registry.get("kpi-athletes");
    expect(renderer?.({ config, onConfigChange: () => {} })).toBe(config);
  });
});
