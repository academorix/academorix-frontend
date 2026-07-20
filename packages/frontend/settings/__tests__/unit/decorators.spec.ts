/**
 * @file decorators.spec.ts
 * @description Round-trip tests for the `@Setting()` / `@Field()` /
 *   `@Group()` / `@Section()` decorator family. Verifies metadata
 *   is written to the constructor and can be read back by the
 *   registry's collectors.
 */

import { describe, it, expect } from "vitest";
import { ControlType } from "@stackra/contracts";

import {
  Field,
  Group,
  Section,
  Setting,
  getFieldDescriptors,
  getGroupDescriptors,
  getSectionDescriptors,
  getSettingMetadata,
} from "@/core";

describe("@Setting / @Field / @Group / @Section decorators", () => {
  @Setting({
    key: "display",
    label: "settings.display.title",
    icon: "monitor",
    order: 1,
  })
  class DisplaySettings {
    @Group({ key: "appearance", label: "settings.display.appearance", order: 1 })
    @Section({ label: "Theme" })
    @Field({
      control: ControlType.Select,
      label: "settings.display.theme",
      defaultValue: "system",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ],
    })
    theme: string = "system";

    @Group({ key: "appearance", label: "settings.display.appearance", order: 1 })
    @Field({
      control: ControlType.Number,
      label: "settings.display.fontSize",
      defaultValue: 14,
      min: 10,
      max: 24,
    })
    fontSize: number = 14;
  }

  it("reads @Setting metadata off the class", () => {
    const meta = getSettingMetadata(DisplaySettings);
    expect(meta?.key).toBe("display");
    expect(meta?.label).toBe("settings.display.title");
    expect(meta?.icon).toBe("monitor");
    expect(meta?.order).toBe(1);
  });

  it("collects @Field descriptors keyed by property name", () => {
    const fields = getFieldDescriptors(DisplaySettings);
    expect(fields).toHaveLength(2);
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    expect(byKey.theme?.control).toBe("select");
    expect(byKey.theme?.defaultValue).toBe("system");
    expect(byKey.theme?.options).toHaveLength(3);
    expect(byKey.fontSize?.min).toBe(10);
    expect(byKey.fontSize?.max).toBe(24);
  });

  it("tags fields with the visual group key", () => {
    const fields = getFieldDescriptors(DisplaySettings);
    for (const field of fields) {
      expect(field.group).toBe("appearance");
    }
  });

  it("collects @Group descriptors with accumulated fieldKeys", () => {
    const groups = getGroupDescriptors(DisplaySettings);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("appearance");
    expect(groups[0]?.fieldKeys).toContain("theme");
    expect(groups[0]?.fieldKeys).toContain("fontSize");
  });

  it("collects @Section descriptors keyed by field", () => {
    const sections = getSectionDescriptors(DisplaySettings);
    expect(sections.get("theme")?.label).toBe("Theme");
    expect(sections.has("fontSize")).toBe(false);
  });

  it("tags fields with the section label", () => {
    const fields = getFieldDescriptors(DisplaySettings);
    const theme = fields.find((f) => f.key === "theme");
    const fontSize = fields.find((f) => f.key === "fontSize");
    expect(theme?.section).toBe("Theme");
    expect(fontSize?.section).toBeUndefined();
  });
});
