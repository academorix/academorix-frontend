/**
 * @file slugify.util.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link slugify} + {@link ensureUniqueSlug}.
 */

import { describe, expect, it } from "vitest";

import { ensureUniqueSlug } from "@/core/utils/ensure-unique-slug.util";
import { slugify } from "@/core/utils/slugify.util";

describe("slugify", () => {
  it("lowercases + trims + replaces spaces with hyphens", () => {
    expect(slugify(" Hello World ")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Réunion")).toBe("cafe-reunion");
  });

  it("collapses runs of non-alphanumeric to a single hyphen", () => {
    expect(slugify("a__b--c!!d")).toBe("a-b-c-d");
  });

  it("caps at 60 characters", () => {
    const long = "a".repeat(80);

    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });

  it("routes reserved slugs through -dashboard", () => {
    expect(slugify("new")).toBe("new-dashboard");
    expect(slugify("edit")).toBe("edit-dashboard");
    expect(slugify("settings")).toBe("settings-dashboard");
  });

  it("routes empty input through -dashboard", () => {
    expect(slugify("")).toBe("dashboard");
    expect(slugify("!!!")).toBe("dashboard");
  });

  it("is idempotent — feeding a slug back returns the same slug", () => {
    const first = slugify("Athletics Overview");

    expect(slugify(first)).toBe(first);
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the candidate when free", () => {
    expect(ensureUniqueSlug("ops", ["overview", "analytics"])).toBe("ops");
  });

  it("appends -2 on first collision", () => {
    expect(ensureUniqueSlug("ops", ["ops"])).toBe("ops-2");
  });

  it("walks the counter until it finds a free suffix", () => {
    expect(ensureUniqueSlug("ops", ["ops", "ops-2", "ops-3"])).toBe("ops-4");
  });

  it("ignores the caller's own current slug on a rename", () => {
    expect(ensureUniqueSlug("ops", ["ops"], "ops")).toBe("ops");
  });
});
