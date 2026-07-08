/**
 * @file is-desktop.test.ts
 * @module desktop/is-desktop.test
 *
 * @description
 * Sanity checks for the runtime detection helper. Both branches (Tauri
 * present vs absent) matter — every downstream adapter relies on the
 * boolean to no-op cleanly in the browser.
 */

import { afterEach, describe, expect, it } from "vitest";

import { isDesktopRuntime } from "@/lib/desktop/is-desktop";

interface TauriWindow extends Window {
  __TAURI_INTERNALS__?: Record<string, unknown>;
  __TAURI__?: Record<string, unknown>;
}

const win = globalThis.window as TauriWindow;

afterEach(() => {
  delete win.__TAURI_INTERNALS__;
  delete win.__TAURI__;
});

describe("isDesktopRuntime", () => {
  it("returns false when no Tauri globals are present", () => {
    expect(isDesktopRuntime()).toBe(false);
  });

  it("returns true when the v2 `__TAURI_INTERNALS__` global is present", () => {
    win.__TAURI_INTERNALS__ = {};
    expect(isDesktopRuntime()).toBe(true);
  });

  it("returns true when the legacy `__TAURI__` global is present", () => {
    win.__TAURI__ = {};
    expect(isDesktopRuntime()).toBe(true);
  });
});
