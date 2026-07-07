/**
 * @file console.test.ts
 * @module @academorix/analytics/adapters/__tests__/console.test
 *
 * @description
 * Coverage for the dev-only console adapter — every method must log
 * a prefixed structured line, `reset()` must log, and the factory
 * accepts a custom prefix.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consoleAnalyticsAdapter, createConsoleAnalyticsAdapter } from "../console.adapter";

let infoSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createConsoleAnalyticsAdapter", () => {
  it("returns an adapter carrying the `console` name", () => {
    const adapter = createConsoleAnalyticsAdapter();

    expect(adapter.name).toBe("console");
  });

  it("logs `track` calls with the default prefix + name + properties", () => {
    const adapter = createConsoleAnalyticsAdapter();

    adapter.track("evt_click", { path: "/dashboard" });

    expect(infoSpy).toHaveBeenCalledWith("[analytics] track", "evt_click", {
      path: "/dashboard",
    });
  });

  it("logs `track` with an empty object when no properties are supplied", () => {
    const adapter = createConsoleAnalyticsAdapter();

    adapter.track("evt_click");

    expect(infoSpy).toHaveBeenCalledWith("[analytics] track", "evt_click", {});
  });

  it("logs `identify` with the full identity payload", () => {
    const adapter = createConsoleAnalyticsAdapter();
    const identity = { id: "u-1", email: "sam@example.com", tenantId: "t-1" };

    adapter.identify(identity);

    expect(infoSpy).toHaveBeenCalledWith("[analytics] identify", identity);
  });

  it("logs `page` with the full pageview payload", () => {
    const adapter = createConsoleAnalyticsAdapter();
    const view = { path: "/dashboard", title: "Home" };

    adapter.page(view);

    expect(infoSpy).toHaveBeenCalledWith("[analytics] page", view);
  });

  it("logs `reset` with a plain prefixed marker (no payload)", () => {
    const adapter = createConsoleAnalyticsAdapter();

    adapter.reset?.();

    expect(infoSpy).toHaveBeenCalledWith("[analytics] reset");
  });

  it("honours a caller-supplied prefix", () => {
    const adapter = createConsoleAnalyticsAdapter("[marketing]");

    adapter.track("evt_click");
    adapter.reset?.();

    expect(infoSpy).toHaveBeenCalledWith("[marketing] track", "evt_click", {});
    expect(infoSpy).toHaveBeenCalledWith("[marketing] reset");
  });
});

describe("consoleAnalyticsAdapter — default singleton", () => {
  it("uses the '[analytics]' prefix out of the box", () => {
    consoleAnalyticsAdapter.track("evt_default");

    expect(infoSpy).toHaveBeenCalledWith("[analytics] track", "evt_default", {});
  });
});
