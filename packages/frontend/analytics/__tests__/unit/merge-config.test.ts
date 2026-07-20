/**
 * @file merge-config.test.ts
 * @module @stackra/analytics/__tests__/unit
 * @description Behavioural tests for `mergeConfig()` — the single
 *   normalisation seam that applies defaults and prunes disabled /
 *   incomplete provider instances (see `ANALYTICS_REQUIRED_FIELDS`).
 */

import { describe, it, expect } from "vitest";
import { mergeConfig } from "@/core/utils/merge-config.util";
import { DEFAULT_ANALYTICS_CONFIG } from "@/core/constants";

describe("mergeConfig", () => {
  it("returns the default config when no options are provided", () => {
    const cfg = mergeConfig();
    expect(cfg.default).toBe("console");
    // Console has no required fields and enabled != false, so it survives.
    expect(cfg.providers).toEqual({ console: { driver: "console" } });
    expect(cfg.requireConsent).toBe(true);
    expect(cfg.bufferUntilConsent).toBe(true);
    expect(cfg.bufferLimit).toBe(100);
  });

  it("preserves the DEFAULT_ANALYTICS_CONFIG for reuse", () => {
    // Guard against accidental mutation of the exported constant during merge.
    expect(DEFAULT_ANALYTICS_CONFIG.providers).toEqual({ console: { driver: "console" } });
  });

  it("prunes providers with enabled=false", () => {
    const cfg = mergeConfig({
      providers: {
        keep: { driver: "console" },
        drop: { driver: "console", enabled: false },
      },
    });

    expect(cfg.providers).toHaveProperty("keep");
    expect(cfg.providers).not.toHaveProperty("drop");
  });

  it("prunes GA4 without a measurementId", () => {
    const cfg = mergeConfig({
      providers: {
        // Missing measurementId — required per ANALYTICS_REQUIRED_FIELDS.
        ga: { driver: "ga4" },
        // Fully-configured GA4 — must survive.
        good: { driver: "ga4", measurementId: "G-XYZ" },
      },
    });

    expect(cfg.providers).not.toHaveProperty("ga");
    expect(cfg.providers).toHaveProperty("good");
  });

  it("prunes marketing pixels without a pixelId", () => {
    const cfg = mergeConfig({
      providers: {
        meta: { driver: "meta-pixel" },
        tik: { driver: "tiktok-pixel", pixelId: "abc" },
      },
    });

    expect(cfg.providers).not.toHaveProperty("meta");
    expect(cfg.providers).toHaveProperty("tik");
  });

  it("treats empty-string required fields as missing", () => {
    const cfg = mergeConfig({
      providers: {
        ga: { driver: "ga4", measurementId: "" },
      },
    });
    expect(cfg.providers).not.toHaveProperty("ga");
  });

  it("filters stack entries pointing at pruned providers", () => {
    const cfg = mergeConfig({
      providers: {
        ga: { driver: "ga4" }, // pruned
        console: { driver: "console" },
      },
      stack: ["ga", "console"],
    });

    expect(cfg.stack).toEqual(["console"]);
  });

  it("does not add a stack entry when the input had none", () => {
    const cfg = mergeConfig({
      providers: {
        console: { driver: "console" },
      },
    });
    // No stack passed in — merged config does not synthesise one.
    expect("stack" in cfg).toBe(false);
  });

  it("accepts unknown drivers (no required-fields entry) and preserves them", () => {
    // Custom drivers have no entry in ANALYTICS_REQUIRED_FIELDS ⇒ never
    // pruned for missing fields, only by `enabled: false`.
    const cfg = mergeConfig({
      providers: {
        custom: { driver: "amplitude", apiKey: "x" },
      },
    });

    expect(cfg.providers).toHaveProperty("custom");
  });

  it("overrides individual defaults without dropping the rest", () => {
    const cfg = mergeConfig({ bufferLimit: 42 });
    expect(cfg.bufferLimit).toBe(42);
    // Other defaults survive.
    expect(cfg.requireConsent).toBe(true);
    expect(cfg.bufferUntilConsent).toBe(true);
  });
});
