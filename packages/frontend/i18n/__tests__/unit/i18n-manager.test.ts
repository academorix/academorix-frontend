import { describe, it, expect, beforeEach } from "vitest";
import { I18nManager } from "@/core/services/i18n-manager.service";

const TRANSLATIONS = {
  en: {
    common: { hello: "Hello {{name}}", items: { one: "{{count}} item", other: "{{count}} items" } },
    auth: { login: "Sign in" },
  },
  ar: { common: { hello: "مرحبا {{name}}" }, auth: { login: "تسجيل الدخول" } },
};

describe("I18nManager", () => {
  let manager: I18nManager;

  beforeEach(() => {
    manager = new I18nManager({
      defaultLocale: "en",
      supportedLocales: ["en", "ar"],
    });
    manager.setTranslations(TRANSLATIONS as any, ["en", "ar"]);
  });

  it("translates a simple key", () => {
    expect(manager.t("auth.login")).toBe("Sign in");
  });

  it("translates with interpolation", () => {
    expect(manager.t("common.hello", { args: { name: "World" } })).toBe("Hello World");
  });

  it("falls back to key when translation is missing", () => {
    expect(manager.t("missing.key")).toBe("missing.key");
  });

  it("respects lang override", () => {
    expect(manager.t("auth.login", { lang: "ar" })).toBe("تسجيل الدخول");
  });

  it("handles pluralization", () => {
    expect(manager.t("common.items", { args: { count: 1 }, count: 1 })).toBe("1 item");
    expect(manager.t("common.items", { args: { count: 5 }, count: 5 })).toBe("5 items");
  });

  it("returns defaultValue when key missing", () => {
    expect(manager.t("missing", { defaultValue: "fallback" })).toBe("fallback");
  });

  it("returns debug key in debug mode", () => {
    expect(manager.t("auth.login", { debug: true })).toBe("auth.login");
  });

  it("getSupportedLanguages returns configured locales", () => {
    expect(manager.getSupportedLanguages()).toEqual(["en", "ar"]);
  });

  it("mergeTranslations adds namespace", () => {
    manager.mergeTranslations("checkout", { en: { title: "Checkout" } as any });
    expect(manager.t("checkout.title")).toBe("Checkout");
  });
});
