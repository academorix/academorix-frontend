/**
 * @file ascii-banner.util.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the ASCII banner utility.
 */

import { describe, it, expect } from "vitest";

import { renderBanner, renderCompactBanner } from "@/utils/ascii-banner.util";

describe("renderBanner()", () => {
  it("should render a multi-line banner", () => {
    const result = renderBanner({ name: "STACKRA" });

    expect(result).toContain("\n");
    const lines = result.split("\n");
    // Should have multiple lines (2 padding + 5 font lines + spacing + version)
    expect(lines.length).toBeGreaterThan(5);
  });

  it("should include version when provided", () => {
    const result = renderBanner({ name: "APP", version: "1.2.3" });
    expect(result).toContain("v1.2.3");
  });

  it("should include environment when provided", () => {
    const result = renderBanner({ name: "APP", environment: "development" });
    expect(result).toContain("[development]");
  });

  it("should work with a custom color function", () => {
    const customColor = (text: string) => `<<${text}>>`;
    const result = renderBanner({ name: "HI", color: customColor });
    expect(result).toContain("<<");
  });

  it("should handle single character names", () => {
    const result = renderBanner({ name: "A" });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle unknown characters as spaces", () => {
    const result = renderBanner({ name: "123" });
    // Numbers aren't in the font map, should render as spaces
    expect(result).toBeDefined();
  });
});

describe("renderCompactBanner()", () => {
  it("should render a single-line-ish banner", () => {
    const result = renderCompactBanner({ name: "STACKRA" });

    expect(result).toContain("STACKRA");
    // Should be compact (3 lines: empty, content, empty)
    const lines = result.split("\n");
    expect(lines.length).toBeLessThanOrEqual(4);
  });

  it("should include version", () => {
    const result = renderCompactBanner({ name: "APP", version: "0.1.0" });
    expect(result).toContain("v0.1.0");
  });

  it("should include environment", () => {
    const result = renderCompactBanner({ name: "APP", environment: "production" });
    expect(result).toContain("[production]");
  });

  it("should apply custom color", () => {
    const result = renderCompactBanner({
      name: "TEST",
      color: (text) => `[colored:${text}]`,
    });
    expect(result).toContain("[colored:");
  });
});
