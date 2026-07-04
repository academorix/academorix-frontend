/**
 * @file i18n-provider.test.ts
 * @module lib/i18n/i18n-provider.test
 *
 * @description
 * Unit tests for the i18n layer against the real message catalogs:
 * {@link translateMessage}'s resolution order (active-locale catalog -> English
 * catalog -> provided default -> raw key), `{{placeholder}}` interpolation, and
 * Refine's two call shapes `(key, params, default)` and `(key, default)`. Also
 * covers {@link createI18nProvider} (locale binding + `changeLocale` callback)
 * and the {@link isRtlLocale} helper.
 *
 * Note: the shipped Arabic catalog mirrors every English key, so there is no
 * real key that is "present in English, missing in Arabic". The English-fallback
 * branch (`?? MESSAGES.en[key]`) is therefore exercised with a locale that has
 * no catalog of its own, which reaches the exact same code path.
 */

import { describe, expect, it, vi } from "vitest";

import type { Locale } from "@/lib/i18n/i18n.types";

import { createI18nProvider, translateMessage } from "@/lib/i18n/i18n-provider";
import { isRtlLocale } from "@/lib/i18n/i18n.types";

/** A locale with no catalog of its own, used to reach the English-fallback branch. */
const UNCATALOGED_LOCALE = "fr" as unknown as Locale;

describe("translateMessage", () => {
  it("returns the Arabic string for a translated key", () => {
    expect(translateMessage("ar", "buttons.save")).toBe("حفظ");
    expect(translateMessage("ar", "app.accessDenied.title")).toBe("تم رفض الوصول");
  });

  it("returns the English string for the English locale", () => {
    expect(translateMessage("en", "buttons.save")).toBe("Save");
  });

  it("falls back to the English catalog when the active locale has no entry", () => {
    expect(translateMessage(UNCATALOGED_LOCALE, "buttons.save")).toBe("Save");
  });

  it("falls back to the provided default message when the key is unknown everywhere", () => {
    expect(translateMessage("ar", "totally.unknown.key", "My default")).toBe("My default");
  });

  it("falls back to the raw key when nothing else resolves", () => {
    expect(translateMessage("en", "totally.unknown.key")).toBe("totally.unknown.key");
  });

  it("interpolates {{placeholder}} values from params", () => {
    expect(translateMessage("en", "unknown.greeting", { name: "Sam" }, "Hi {{name}}!")).toBe(
      "Hi Sam!",
    );
  });

  it("tolerates whitespace inside placeholders", () => {
    expect(translateMessage("en", "unknown.greeting", { name: "Sam" }, "Hi {{ name }}!")).toBe(
      "Hi Sam!",
    );
  });

  it("leaves unmatched placeholders intact", () => {
    expect(translateMessage("en", "unknown.greeting", { other: "x" }, "Hi {{name}}")).toBe(
      "Hi {{name}}",
    );
  });

  it("supports the two-argument (key, defaultMessage) form", () => {
    // Key exists -> the default is ignored.
    expect(translateMessage("en", "buttons.save", "ignored default")).toBe("Save");
    // Key missing -> the second string argument is used as the default.
    expect(translateMessage("en", "unknown.button", "Used default")).toBe("Used default");
  });
});

describe("createI18nProvider", () => {
  it("binds getLocale to the provided locale", () => {
    expect(createI18nProvider("ar", () => {}).getLocale()).toBe("ar");
    expect(createI18nProvider("en", () => {}).getLocale()).toBe("en");
  });

  it("translates through the bound locale", () => {
    const provider = createI18nProvider("ar", () => {});

    expect(provider.translate("buttons.save")).toBe("حفظ");
  });

  it("invokes the changeLocale callback and resolves", async () => {
    const onChange = vi.fn();
    const provider = createI18nProvider("en", onChange);

    await provider.changeLocale("ar");

    expect(onChange).toHaveBeenCalledWith("ar");
  });
});

describe("isRtlLocale", () => {
  it("reports Arabic as right-to-left", () => {
    expect(isRtlLocale("ar")).toBe(true);
  });

  it("reports English as left-to-right", () => {
    expect(isRtlLocale("en")).toBe(false);
  });
});
