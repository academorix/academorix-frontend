/**
 * @file device.test.ts
 * @module lib/http/device.test
 *
 * @description
 * Unit tests for the device-fingerprint headers the backend uses for session
 * records + audit trails (see PLAN.md §6). Covers:
 * - Persisted, stable {@link getDeviceId} (UUID mirrored in localStorage).
 * - Full header set emitted by {@link deviceHeaders} (`X-Client`, `X-Device-*`,
 *   `X-Timezone`, `X-Locale`) with non-empty values.
 * - `X-Locale` reflects `<html lang>` when present and falls back otherwise.
 * - Human-readable {@link deviceLabel} used as the Sanctum PAT name.
 *
 * Both the module-scoped cache and `localStorage` are reset in `beforeEach` so
 * each case starts from an unknown-device state.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetDeviceCacheForTests,
  deviceHeaders,
  deviceLabel,
  getDeviceId,
} from "@/lib/http/device";

/** localStorage key the persistence layer writes under. */
const DEVICE_ID_KEY = "academorix.device.id";

/** Restores the `<html lang>` attribute after tests that mutate it. */
let originalLang: string;

beforeEach(() => {
  __resetDeviceCacheForTests();
  window.localStorage.clear();
  originalLang = document.documentElement.lang;
});

afterEach(() => {
  __resetDeviceCacheForTests();
  window.localStorage.clear();
  document.documentElement.lang = originalLang;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getDeviceId", () => {
  it("returns a non-empty string", () => {
    const id = getDeviceId();

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns a canonical UUID (crypto.randomUUID output)", () => {
    // jsdom exposes `crypto.randomUUID`, so the primary code path runs.
    const id = getDeviceId();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("returns the same value on repeated calls within a session (in-memory cache)", () => {
    const first = getDeviceId();
    const second = getDeviceId();

    expect(second).toBe(first);
  });

  it("persists the id under localStorage['academorix.device.id']", () => {
    const id = getDeviceId();

    expect(window.localStorage.getItem(DEVICE_ID_KEY)).toBe(id);
  });

  it("rehydrates the same id from localStorage across cache resets", () => {
    const first = getDeviceId();

    __resetDeviceCacheForTests();

    const second = getDeviceId();

    expect(second).toBe(first);
  });

  it("honours a deterministic crypto.randomUUID stub", () => {
    const fixed = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

    vi.stubGlobal("crypto", { ...crypto, randomUUID: (): string => fixed });

    expect(getDeviceId()).toBe(fixed);
  });
});

describe("deviceHeaders", () => {
  it("returns every required header with non-empty string values", () => {
    const headers = deviceHeaders();

    for (const key of [
      "X-Client",
      "X-Device-Id",
      "X-Device-Name",
      "X-Device-Platform",
      "X-Device-Type",
      "X-Timezone",
      "X-Locale",
    ] as const) {
      const value = headers[key];

      expect(value).toBeDefined();
      expect(typeof value).toBe("string");
      expect((value ?? "").length).toBeGreaterThan(0);
    }
  });

  it("uses the persisted device id in X-Device-Id", () => {
    const id = getDeviceId();

    expect(deviceHeaders()["X-Device-Id"]).toBe(id);
  });

  it("names the client with the 'academorix-web/' prefix", () => {
    expect(deviceHeaders()["X-Client"]).toMatch(/^academorix-web\//);
  });

  it("emits an X-Device-Type in the known set", () => {
    const type = deviceHeaders()["X-Device-Type"];

    expect(["desktop", "mobile", "tablet"]).toContain(type);
  });

  it("reads X-Locale from <html lang> when set", () => {
    document.documentElement.lang = "ar";

    // Cache the header set once (locale is read fresh on every call).
    deviceHeaders();

    expect(deviceHeaders()["X-Locale"]).toBe("ar");
  });

  it("falls back away from <html lang> when the attribute is cleared", () => {
    document.documentElement.lang = "";

    const locale = deviceHeaders()["X-Locale"];

    expect(locale).toBeDefined();
    expect((locale ?? "").length).toBeGreaterThan(0);
    expect(locale).not.toBe("");
  });
});

describe("deviceLabel", () => {
  it("returns a '{browser} on {os}' style string", () => {
    // jsdom's UA sniffing yields "Unknown on Unknown" — the exact strings are
    // irrelevant; the shape is what backend + shell code rely on.
    expect(deviceLabel()).toMatch(/^\S.* on \S.*$/);
  });
});
