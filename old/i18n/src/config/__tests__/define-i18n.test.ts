/**
 * @file define-i18n.test.ts
 * @module @academorix/i18n/config/__tests__/define-i18n.test
 *
 * @description
 * Verifies the {@link defineI18nConfig} passthrough: the returned
 * object is frozen (mutation throws in strict mode) and the generic
 * `TLocale` is inferred from the caller's `locales` tuple. The latter
 * is a compile-time property, so we assert it via a type-only test —
 * if the file typechecks, the assertion holds.
 */

import { describe, expect, it } from "vitest";

import { defineI18nConfig } from "../define-i18n.util";

describe("defineI18nConfig", () => {
  it("freezes the returned object so accidental mutation throws in strict mode", () => {
    const config = defineI18nConfig({
      locales: ["en", "ar"] as const,
      defaultLocale: "en",
      rtlLocales: ["ar"] as const,
      labels: { en: "English", ar: "العربية" },
      bcp47: { en: "en-US", ar: "ar-EG" },
      storageKey: "test.locale",
    });

    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      // ESM modules are strict-mode by default; assigning to a frozen
      // property throws a TypeError rather than silently failing.
      (config as { defaultLocale: string }).defaultLocale = "ar";
    }).toThrow(TypeError);
  });

  it("returns the same reference it was given (no cloning)", () => {
    const input = {
      locales: ["en", "ar"] as const,
      defaultLocale: "en" as const,
      rtlLocales: ["ar"] as const,
      labels: { en: "English", ar: "العربية" },
      bcp47: { en: "en-US", ar: "ar-EG" },
      storageKey: "test.locale",
    };
    const config = defineI18nConfig(input);

    // `Object.freeze` mutates in-place and returns the same reference —
    // the passthrough contract.
    expect(config).toBe(input);
  });

  it("infers TLocale from the caller's locales tuple (type-level check)", () => {
    const config = defineI18nConfig({
      locales: ["en", "ar", "de"] as const,
      defaultLocale: "en",
      rtlLocales: [] as const,
      labels: { en: "English", ar: "العربية", de: "Deutsch" },
      bcp47: { en: "en-US", ar: "ar-EG", de: "de-DE" },
      storageKey: "test.locale",
    });

    // The following assignments only compile because `TLocale` was
    // inferred as `"en" | "ar" | "de"`. Widening to `string` would
    // make the assignment fail (`labels` would need an index signature).
    const enLabel: string = config.labels.en;
    const arLabel: string = config.labels.ar;
    const deLabel: string = config.labels.de;

    expect([enLabel, arLabel, deLabel]).toEqual(["English", "العربية", "Deutsch"]);
  });
});
