/**
 * @file merge-config.test.ts
 * @module @stackra/monitoring/__tests__/unit
 * @description Behavioural tests for `mergeConfig()` — apply defaults
 *   then prune inactive or incomplete provider instances (see
 *   `MONITORING_REQUIRED_FIELDS`).
 */

import { describe, it, expect } from "vitest";
import { mergeConfig } from "@/core/utils/merge-config.util";
import { DEFAULT_MONITORING_CONFIG } from "@/core/constants";

describe("mergeConfig", () => {
  it("returns the defaults when no options are provided", () => {
    const cfg = mergeConfig();
    expect(cfg.default).toBe("console");
    expect(cfg.providers).toEqual({ console: { driver: "console" } });
  });

  it("does not mutate DEFAULT_MONITORING_CONFIG", () => {
    // Guard against accidental in-place mutation via spread.
    expect(DEFAULT_MONITORING_CONFIG.providers).toEqual({
      console: { driver: "console" },
    });
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

  it("prunes Sentry instances missing a DSN", () => {
    const cfg = mergeConfig({
      providers: {
        // Sentry driver requires a `dsn` per MONITORING_REQUIRED_FIELDS.
        sentry: { driver: "sentry" },
        good: { driver: "sentry", dsn: "https://x@sentry.io/1" },
      },
    });
    expect(cfg.providers).not.toHaveProperty("sentry");
    expect(cfg.providers).toHaveProperty("good");
  });

  it("treats empty-string DSN as missing", () => {
    const cfg = mergeConfig({
      providers: { sentry: { driver: "sentry", dsn: "" } },
    });
    expect(cfg.providers).not.toHaveProperty("sentry");
  });

  it("filters stack entries that point at pruned providers", () => {
    const cfg = mergeConfig({
      providers: {
        sentry: { driver: "sentry" }, // pruned
        console: { driver: "console" },
      },
      stack: ["sentry", "console"],
    });
    expect(cfg.stack).toEqual(["console"]);
  });

  it("does not synthesise a stack when none was given", () => {
    const cfg = mergeConfig({
      providers: { console: { driver: "console" } },
    });
    expect("stack" in cfg).toBe(false);
  });

  it("preserves custom drivers with no required-fields entry", () => {
    const cfg = mergeConfig({
      providers: { custom: { driver: "datadog", apiKey: "x" } },
    });
    expect(cfg.providers).toHaveProperty("custom");
  });

  it("honours environment and release overrides", () => {
    const cfg = mergeConfig({ environment: "staging", release: "v1.2.3" });
    expect(cfg.environment).toBe("staging");
    expect(cfg.release).toBe("v1.2.3");
  });
});
