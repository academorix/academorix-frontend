/**
 * @file device-headers.test.ts
 * @module @academorix/http/device/device-headers.test
 *
 * @description
 * Unit tests for {@link createDeviceHeadersReader}, {@link deviceLabel},
 * and {@link getDeviceLocale}. Runs under the `jsdom` environment so
 * `document`, `window.localStorage`, `crypto.randomUUID`, `Intl`, and
 * `navigator` are all present. Each case that needs a specific UA or
 * environment shape restores globals in `afterEach` via
 * `vi.unstubAllGlobals()` + explicit descriptor teardown.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDeviceHeadersReader, deviceLabel } from "../device-headers.util";
import { getDeviceLocale } from "../locale.util";

/** The localStorage key the persistence layer writes under by default. */
const DEFAULT_DEVICE_ID_KEY = "academorix.device.id";

/** Descriptors captured so we can restore them after each test. */
const originalUserAgentDescriptor = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  "userAgent",
);
const originalLanguageDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, "language");

/**
 * Shadows `navigator.userAgent` with a data property on the instance.
 * The descriptor is `configurable: true` so `restoreNavigator` can
 * `delete` it without leaving a lingering stub.
 */
function stubUserAgent(ua: string): void {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
    writable: false,
  });
}

/** Shadows `navigator.language` with a data property on the instance. */
function stubLanguage(language: string): void {
  Object.defineProperty(navigator, "language", {
    value: language,
    configurable: true,
    writable: false,
  });
}

/** Undoes both stubs by removing any instance-level shadow properties. */
function restoreNavigator(): void {
  if (Object.prototype.hasOwnProperty.call(navigator, "userAgent")) {
    delete (navigator as unknown as { userAgent?: string }).userAgent;
  }

  if (Object.prototype.hasOwnProperty.call(navigator, "language")) {
    delete (navigator as unknown as { language?: string }).language;
  }
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  restoreNavigator();
  window.localStorage.clear();
  document.documentElement.lang = "";
  // Belt-and-braces: reinstate the prototype descriptors if a test replaced them.
  if (
    originalUserAgentDescriptor &&
    !Object.prototype.hasOwnProperty.call(navigator, "userAgent")
  ) {
    Object.defineProperty(Navigator.prototype, "userAgent", originalUserAgentDescriptor);
  }
  if (originalLanguageDescriptor && !Object.prototype.hasOwnProperty.call(navigator, "language")) {
    Object.defineProperty(Navigator.prototype, "language", originalLanguageDescriptor);
  }
});

describe("createDeviceHeadersReader", () => {
  it("returns a callable function that emits a header record", () => {
    const reader = createDeviceHeadersReader();

    expect(typeof reader).toBe("function");
    expect(reader()).toMatchObject({ "X-Client": expect.any(String) });
  });

  it("emits X-Client as '<clientName>/<clientVersion>'", () => {
    const reader = createDeviceHeadersReader({
      clientName: "academorix-dashboard",
      clientVersion: "1.2.3",
    });

    expect(reader()["X-Client"]).toBe("academorix-dashboard/1.2.3");
  });

  it("emits X-Device-Id and persists it into localStorage under the default key", () => {
    const reader = createDeviceHeadersReader();

    const id = reader()["X-Device-Id"];

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(window.localStorage.getItem(DEFAULT_DEVICE_ID_KEY)).toBe(id);
  });

  it("returns the same X-Device-Id across two independent reader instances (localStorage-backed)", () => {
    const first = createDeviceHeadersReader()()["X-Device-Id"];
    const second = createDeviceHeadersReader()()["X-Device-Id"];

    expect(second).toBe(first);
  });

  it("emits X-Timezone read from Intl.DateTimeFormat", () => {
    const spy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(
        () => ({ resolvedOptions: () => ({ timeZone: "Europe/Paris" }) }) as never,
      );

    const reader = createDeviceHeadersReader();

    expect(reader()["X-Timezone"]).toBe("Europe/Paris");
    expect(spy).toHaveBeenCalled();
  });

  it("emits X-Locale from the readLocale closure on every call (not cached)", () => {
    const readLocale = vi.fn().mockReturnValueOnce("ar").mockReturnValueOnce("fr");
    const reader = createDeviceHeadersReader({ readLocale });

    expect(reader()["X-Locale"]).toBe("ar");
    expect(reader()["X-Locale"]).toBe("fr");
    expect(readLocale).toHaveBeenCalledTimes(2);
  });

  it("reads the locale via document.documentElement.lang when no override is supplied", () => {
    document.documentElement.lang = "ar";
    const reader = createDeviceHeadersReader();

    expect(reader()["X-Locale"]).toBe("ar");
  });

  it("emits X-Device-Name, X-Device-Platform, and X-Device-Type as non-empty strings", () => {
    const reader = createDeviceHeadersReader();
    const headers = reader();

    for (const key of ["X-Device-Name", "X-Device-Platform", "X-Device-Type"] as const) {
      expect(typeof headers[key]).toBe("string");
      expect((headers[key] ?? "").length).toBeGreaterThan(0);
    }
  });

  it("falls back to 'Unknown' fields when navigator is unavailable (SSR path)", () => {
    vi.stubGlobal("navigator", undefined);

    const reader = createDeviceHeadersReader({ readLocale: () => "en" });
    const headers = reader();

    expect(headers["X-Device-Name"]).toBe("Unknown on Unknown");
    expect(headers["X-Device-Platform"]).toBe("Unknown");
    // detectDeviceType short-circuits to "desktop" when navigator is missing.
    expect(headers["X-Device-Type"]).toBe("desktop");
  });

  it("falls back to 'UTC' for X-Timezone when Intl.DateTimeFormat throws", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("no intl");
    });

    const reader = createDeviceHeadersReader();

    expect(reader()["X-Timezone"]).toBe("UTC");
  });

  it("classifies a mobile user-agent as X-Device-Type: mobile", () => {
    stubUserAgent(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
    );

    const reader = createDeviceHeadersReader();

    expect(reader()["X-Device-Type"]).toBe("mobile");
  });

  it("classifies an iPad user-agent as X-Device-Type: tablet", () => {
    stubUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    );

    const reader = createDeviceHeadersReader();

    expect(reader()["X-Device-Type"]).toBe("tablet");
  });

  it("mints a fresh UUID via crypto.randomUUID when localStorage is empty", () => {
    const uuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const randomUUID = vi.fn(() => uuid);

    vi.stubGlobal("crypto", { ...globalThis.crypto, randomUUID });

    const reader = createDeviceHeadersReader();

    expect(reader()["X-Device-Id"]).toBe(uuid);
    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(DEFAULT_DEVICE_ID_KEY)).toBe(uuid);
  });

  it("honours a custom deviceIdStorageKey", () => {
    const reader = createDeviceHeadersReader({ deviceIdStorageKey: "custom.device.id" });
    const id = reader()["X-Device-Id"];

    expect(window.localStorage.getItem("custom.device.id")).toBe(id);
    expect(window.localStorage.getItem(DEFAULT_DEVICE_ID_KEY)).toBeNull();
  });
});

describe("getDeviceLocale", () => {
  it("returns document.documentElement.lang when it is set", () => {
    document.documentElement.lang = "ar-SA";

    expect(getDeviceLocale()).toBe("ar-SA");
  });

  it("falls back to navigator.language when <html lang> is empty", () => {
    document.documentElement.lang = "";
    stubLanguage("fr-FR");

    expect(getDeviceLocale()).toBe("fr-FR");
  });

  it("falls back to 'en' when both <html lang> and navigator.language are unavailable", () => {
    document.documentElement.lang = "";
    stubLanguage("");

    expect(getDeviceLocale()).toBe("en");
  });
});

describe("deviceLabel", () => {
  it("returns '<browser> on <os>' derived from the current UA", () => {
    stubUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    );

    expect(deviceLabel()).toBe("Chrome on Windows 10");
  });

  it("returns 'Unknown on Unknown' when the UA is not recognised", () => {
    // jsdom's default UA ("Mozilla/5.0 (darwin) ... jsdom/29.1.1") does not
    // match any of the /Edg\//, /Chrome\//, /Firefox\//, or /Safari\//
    // patterns, nor any OS pattern. The output is the neutral fallback.
    expect(deviceLabel()).toBe("Unknown on Unknown");
  });
});
