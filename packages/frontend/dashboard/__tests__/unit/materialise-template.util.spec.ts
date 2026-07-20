/**
 * @file materialise-template.util.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for the template materialiser.
 */

import { describe, expect, it } from "vitest";

import type { IDashboardTemplate } from "@/core/interfaces/dashboard-template.interface";
import { materialiseTemplate } from "@/core/utils/materialise-template.util";

const spanFor = (): "third" => "third";

const template: IDashboardTemplate = {
  id: "test",
  name: "Test",
  description: "Test template",
  icon: "square",
  layoutMode: "grid",
  keys: ["a", "b", "c"],
};

describe("materialiseTemplate", () => {
  it("emits one widget instance per template key", () => {
    const { widgets } = materialiseTemplate(template, "user-1", spanFor);

    expect(widgets).toHaveLength(template.keys.length);
  });

  it("emits one layout entry per widget at every breakpoint", () => {
    const { widgets, layouts } = materialiseTemplate(template, "user-1", spanFor);

    for (const bp of ["lg", "md", "sm"] as const) {
      expect(layouts[bp]).toHaveLength(widgets.length);
    }
  });

  it("keeps widget ids consistent across breakpoints", () => {
    const { widgets, layouts } = materialiseTemplate(template, "user-1", spanFor);
    const ids = new Set(widgets.map((widget) => widget.id));

    for (const bp of ["lg", "md", "sm"] as const) {
      for (const item of layouts[bp]) {
        expect(ids.has(item.widgetId)).toBe(true);
      }
    }
  });

  it("returns empty arrays for a template with no keys", () => {
    const { widgets, layouts } = materialiseTemplate(
      { ...template, keys: [] },
      "user-1",
      spanFor,
    );

    expect(widgets).toEqual([]);
    expect(layouts.lg).toEqual([]);
    expect(layouts.md).toEqual([]);
    expect(layouts.sm).toEqual([]);
  });
});
