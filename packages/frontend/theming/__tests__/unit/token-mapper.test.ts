/**
 * @file token-mapper.test.ts
 * @module @stackra/theming/test
 * @description Unit tests for token mapper utilities.
 */

import { describe, it, expect } from "vitest";
import { tokenToCssVar, separateTokensByMode, mapTokensToVars } from "@/core/utils";

describe("tokenToCssVar", () => {
  it("should convert simple token", () => {
    expect(tokenToCssVar("accent")).toBe("--accent");
  });

  it("should convert snake_case to kebab-case", () => {
    expect(tokenToCssVar("surface_secondary")).toBe("--surface-secondary");
  });

  it("should handle multiple underscores", () => {
    expect(tokenToCssVar("chart_color_1")).toBe("--chart-color-1");
  });
});

describe("separateTokensByMode", () => {
  it("should separate light and dark tokens", () => {
    const result = separateTokensByMode({
      accent: "oklch(0.62 0.19 253)",
      dark_background: "oklch(0.12 0.005 285)",
      background: "oklch(0.97 0 0)",
    });

    expect(result.light).toEqual({
      accent: "oklch(0.62 0.19 253)",
      background: "oklch(0.97 0 0)",
    });
    expect(result.dark).toEqual({
      background: "oklch(0.12 0.005 285)",
    });
  });

  it("should skip null/undefined values", () => {
    const result = separateTokensByMode({
      accent: "red",
      empty: null as any,
      undef: undefined as any,
    });

    expect(result.light).toEqual({ accent: "red" });
    expect(result.dark).toEqual({});
  });
});

describe("mapTokensToVars", () => {
  it("should map tokens to CSS variable entries", () => {
    const result = mapTokensToVars({ accent: "oklch(0.62 0.19 253)" });
    expect(result).toEqual([{ variable: "--accent", value: "oklch(0.62 0.19 253)" }]);
  });

  it("should handle multiple tokens", () => {
    const result = mapTokensToVars({
      surface_secondary: "#f4f4f5",
      radius: "0.5rem",
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ variable: "--surface-secondary", value: "#f4f4f5" });
    expect(result[1]).toEqual({ variable: "--radius", value: "0.5rem" });
  });

  it("should skip null values", () => {
    const result = mapTokensToVars({ valid: "yes", empty: null as any });
    expect(result).toHaveLength(1);
  });
});
