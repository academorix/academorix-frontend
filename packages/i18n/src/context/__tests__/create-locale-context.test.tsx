/**
 * @file create-locale-context.test.tsx
 * @module @academorix/i18n/context/__tests__/create-locale-context.test
 *
 * @description
 * Covers the {@link createLocaleContext} factory end-to-end: initial
 * state resolution (localStorage → prop override → default),
 * persistence, `<html lang>` + `<html dir>` sync, the narrowing
 * predicates (`isSupportedLocale`, `isRtlLocale`, `resolveLocale`),
 * error behaviour when the hook is used outside a provider, and
 * factory isolation (two independent providers on the same page).
 */

import { act, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineI18nConfig } from "../../config/define-i18n.util";
import { createLocaleContext } from "../create-locale-context";

import type { PropsWithChildren } from "react";

/** Reusable two-locale config for the tests. */
const STUB_CONFIG = defineI18nConfig({
  locales: ["en", "ar"] as const,
  defaultLocale: "en",
  rtlLocales: ["ar"] as const,
  labels: { en: "English", ar: "العربية" },
  bcp47: { en: "en-US", ar: "ar-EG" },
  storageKey: "test.locale",
});

type StubLocale = (typeof STUB_CONFIG.locales)[number];

beforeEach(() => {
  window.localStorage.clear();
  // Reset the <html> attributes each test seeds them itself.
  document.documentElement.lang = "";
  document.documentElement.dir = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("createLocaleContext — factory return shape", () => {
  it("returns the bound config on the bundle for downstream tooling", () => {
    const bundle = createLocaleContext<StubLocale>(STUB_CONFIG);

    expect(bundle.config).toBe(STUB_CONFIG);
  });
});

describe("LocaleProvider — initial state", () => {
  it("starts on the configured defaultLocale when localStorage is empty", () => {
    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("en");
  });

  it("reads a pre-populated localStorage value on first render", () => {
    window.localStorage.setItem(STUB_CONFIG.storageKey, "ar");

    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("ar");
  });

  it("falls back to the default when localStorage holds an unsupported value", () => {
    window.localStorage.setItem(STUB_CONFIG.storageKey, "fr");

    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("en");
  });

  it("initialLocale prop wins over the persisted preference", () => {
    window.localStorage.setItem(STUB_CONFIG.storageKey, "ar");

    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider initialLocale="en">{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("en");
  });
});

describe("LocaleProvider — setLocale side effects", () => {
  it("switches to Arabic and mirrors <html lang='ar' dir='rtl'>", () => {
    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    act(() => {
      result.current.setLocale("ar");
    });

    expect(result.current.locale).toBe("ar");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("switches back to English and resets dir to ltr", () => {
    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider initialLocale="ar">{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    // Sanity — the "ar" starting state sets dir=rtl.
    expect(document.documentElement.dir).toBe("rtl");

    act(() => {
      result.current.setLocale("en");
    });

    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("persists the chosen locale to localStorage", () => {
    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    act(() => {
      result.current.setLocale("ar");
    });

    expect(window.localStorage.getItem(STUB_CONFIG.storageKey)).toBe("ar");
  });

  it("still updates local state when localStorage.setItem throws", () => {
    // Storage failures happen in private-mode Safari + iframes without
    // `allow-same-origin`. The provider must silently ignore the write
    // failure and keep the in-memory state consistent.
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { LocaleProvider, useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(() => {
      act(() => {
        result.current.setLocale("ar");
      });
    }).not.toThrow();

    expect(result.current.locale).toBe("ar");
    expect(setItemSpy).toHaveBeenCalledWith(STUB_CONFIG.storageKey, "ar");
  });
});

describe("Predicates — isSupportedLocale / isRtlLocale / resolveLocale", () => {
  const { isSupportedLocale, isRtlLocale, resolveLocale } =
    createLocaleContext<StubLocale>(STUB_CONFIG);

  it("recognises configured locales as supported", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("ar")).toBe(true);
  });

  it("rejects an unknown locale code", () => {
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
  });

  it("recognises Arabic as an RTL locale", () => {
    expect(isRtlLocale("ar")).toBe(true);
  });

  it("recognises English as an LTR (non-RTL) locale", () => {
    expect(isRtlLocale("en")).toBe(false);
  });

  it("passes through a supported locale via resolveLocale", () => {
    expect(resolveLocale("ar")).toBe("ar");
  });

  it("falls back to the default for an unsupported locale via resolveLocale", () => {
    expect(resolveLocale("de")).toBe("en");
  });

  it("falls back to the default for null / undefined input via resolveLocale", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale(null)).toBe("en");
  });
});

describe("useLocale — guard rail", () => {
  it("throws when called outside a LocaleProvider", () => {
    const { useLocale } = createLocaleContext<StubLocale>(STUB_CONFIG);

    // React logs the error boundary trace to console.error; silence it
    // so the test output stays clean.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useLocale())).toThrow(
      /useLocale must be used within a <LocaleProvider>/,
    );

    consoleError.mockRestore();
  });
});

describe("Factory isolation — two independent providers", () => {
  it("gives each factory call its own private context", () => {
    // A second config with a different default and storage key. Both
    // factories should live side-by-side without interfering.
    const OTHER_CONFIG = defineI18nConfig({
      locales: ["en", "ar"] as const,
      defaultLocale: "ar",
      rtlLocales: ["ar"] as const,
      labels: { en: "English", ar: "العربية" },
      bcp47: { en: "en-US", ar: "ar-EG" },
      storageKey: "other.locale",
    });

    const first = createLocaleContext<StubLocale>(STUB_CONFIG);
    const second = createLocaleContext<StubLocale>(OTHER_CONFIG);

    let firstLocale: StubLocale | undefined;
    let secondLocale: StubLocale | undefined;

    function FirstConsumer(): React.ReactElement {
      firstLocale = first.useLocale().locale;

      return <span data-testid="first">{firstLocale}</span>;
    }

    function SecondConsumer(): React.ReactElement {
      secondLocale = second.useLocale().locale;

      return <span data-testid="second">{secondLocale}</span>;
    }

    render(
      <first.LocaleProvider>
        <second.LocaleProvider>
          <FirstConsumer />
          <SecondConsumer />
        </second.LocaleProvider>
      </first.LocaleProvider>,
    );

    // Each provider seeds from its OWN default — proof they carry
    // independent context objects.
    expect(firstLocale).toBe("en");
    expect(secondLocale).toBe("ar");
  });
});
