/**
 * @file theme-registry.test.ts
 * @module @stackra/theming/test
 * @description Unit tests for ThemeRegistry.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ThemeRegistry } from "@/core/registries";
import { BUILT_IN_THEMES } from "@/core/constants";

describe("ThemeRegistry", () => {
  let registry: ThemeRegistry;

  beforeEach(() => {
    registry = new ThemeRegistry();
  });

  it("should start empty", () => {
    expect(registry.getThemes()).toHaveLength(0);
  });

  it("should seed 11 built-in themes", () => {
    registry.seedBuiltInThemes();
    expect(registry.getThemes()).toHaveLength(11);
  });

  it("should register a theme", () => {
    registry.register("custom", { id: "custom", color: "#FF0000", label: "Custom" });
    expect(registry.has("custom")).toBe(true);
    expect(registry.get("custom")?.color).toBe("#FF0000");
  });

  it("should remove a theme", () => {
    registry.register("temp", { id: "temp", color: "#000", label: "Temp" });
    expect(registry.has("temp")).toBe(true);
    registry.remove("temp");
    expect(registry.has("temp")).toBe(false);
  });

  it("should increment revision on register", () => {
    const rev = registry.getRevision();
    registry.register("x", { id: "x", color: "#000", label: "X" });
    expect(registry.getRevision()).toBe(rev + 1);
  });

  it("should increment revision on remove", () => {
    registry.register("x", { id: "x", color: "#000", label: "X" });
    const rev = registry.getRevision();
    registry.remove("x");
    expect(registry.getRevision()).toBe(rev + 1);
  });

  it("should return all theme IDs", () => {
    registry.seedBuiltInThemes();
    const ids = registry.getThemeIds();
    expect(ids).toContain("default");
    expect(ids).toContain("sky");
    expect(ids).toContain("rabbit");
    expect(ids).toHaveLength(11);
  });

  it("seedConfigThemes should not overwrite existing", () => {
    registry.register("sky", { id: "sky", color: "#CUSTOM", label: "Custom Sky" });
    registry.seedConfigThemes(BUILT_IN_THEMES);
    expect(registry.get("sky")?.color).toBe("#CUSTOM");
  });
});
