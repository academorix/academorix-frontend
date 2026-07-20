import { describe, it, expect } from "vitest";
import { resolveLanguage, getNextFallbackLanguage } from "@/core/utils/resolve-language.util";

describe("resolveLanguage", () => {
  const supported = ["en", "ar", "fr"];

  it("returns the locale when directly supported", () => {
    expect(resolveLanguage("en", supported)).toBe("en");
  });

  it("resolves via fallback map", () => {
    expect(resolveLanguage("en-US", supported, { "en-US": "en" })).toBe("en");
  });

  it("resolves wildcard fallbacks", () => {
    expect(resolveLanguage("ar-SA", supported, { "ar-*": "ar" })).toBe("ar");
  });

  it("falls back to base language (en-US → en)", () => {
    expect(resolveLanguage("en-US", supported)).toBe("en");
  });

  it("returns the original lang when not supported and no fallback", () => {
    expect(resolveLanguage("de", supported)).toBe("de");
  });
});

describe("getNextFallbackLanguage", () => {
  it("strips region from hyphenated locale", () => {
    expect(getNextFallbackLanguage("en-US", "en")).toBe("en");
  });

  it("strips region from underscore locale", () => {
    expect(getNextFallbackLanguage("ar_SA", "en")).toBe("ar");
  });

  it("returns defaultLocale for base locales", () => {
    expect(getNextFallbackLanguage("de", "en")).toBe("en");
  });
});
