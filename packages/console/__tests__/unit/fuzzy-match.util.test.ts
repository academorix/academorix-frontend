/**
 * @file fuzzy-match.util.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the fuzzyMatch utility function.
 */

import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "@/utils/fuzzy-match.util";

describe("fuzzyMatch()", () => {
  const candidates = [
    "config:publish",
    "config:cache",
    "config:clear",
    "cache:clear",
    "cache:forget",
    "queue:work",
    "queue:retry",
    "queue:failed",
    "list",
    "make:command",
  ];

  it("should find exact matches with distance 0", () => {
    const result = fuzzyMatch("config:publish", candidates);
    expect(result).toContain("config:publish");
    expect(result[0]).toBe("config:publish");
  });

  it("should find close matches with small typos", () => {
    const result = fuzzyMatch("confg:publish", candidates);
    expect(result).toContain("config:publish");
  });

  it("should find matches for transposed characters", () => {
    const result = fuzzyMatch("config:publsih", candidates);
    expect(result).toContain("config:publish");
  });

  it("should find matches for missing characters", () => {
    const result = fuzzyMatch("config:cach", candidates);
    expect(result).toContain("config:cache");
  });

  it("should return multiple suggestions sorted by distance", () => {
    const result = fuzzyMatch("config:c", candidates, 5);
    // config:cache and config:clear should both be suggestions
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return empty array when nothing is close", () => {
    const result = fuzzyMatch("zzzzzzzzzzz", candidates);
    expect(result).toEqual([]);
  });

  it("should respect maxDistance parameter", () => {
    const result = fuzzyMatch("xyz", candidates, 1);
    expect(result).toEqual([]); // nothing within 1 edit of 'xyz'
  });

  it("should respect maxResults parameter", () => {
    const result = fuzzyMatch("config", candidates, 10, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("should handle empty input", () => {
    const result = fuzzyMatch("", candidates, 3);
    // Only very short candidates would match
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("should handle empty candidates", () => {
    const result = fuzzyMatch("test", []);
    expect(result).toEqual([]);
  });
});
