/**
 * @file slugify.util.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the `slugify` alias helper.
 */

import { describe, expect, it } from "vitest";

import { slugify } from "@/core/utils/slugify.util";

describe("slugify", () => {
  it("lowercases and joins words with a hyphen", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips punctuation from the middle of the string", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses runs of whitespace + punctuation into a single separator", () => {
    expect(slugify("Hello   ---  World")).toBe("hello-world");
  });

  it("normalises unicode diacritics", () => {
    expect(slugify("Café Français")).toBe("cafe-francais");
  });

  it("returns an empty string when the input is empty", () => {
    expect(slugify("")).toBe("");
  });
});
