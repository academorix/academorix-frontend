/**
 * @file merge-config.util.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for `mergeConfig` — the single source of
 *   truth for routing module option normalisation.
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_ROUTING_CONFIG } from "@/core/constants";
import { mergeConfig } from "@/core/utils/merge-config.util";

describe("mergeConfig", () => {
  it("returns the defaults when no options are provided", () => {
    expect(mergeConfig()).toEqual({
      ...DEFAULT_ROUTING_CONFIG,
      // devSubdomains normalises to a fresh array — expect the same
      // shape, not the exact reference.
      devSubdomains: [],
      prerender: { ...DEFAULT_ROUTING_CONFIG.prerender },
    });
  });

  it("overrides scalar defaults with user values", () => {
    const merged = mergeConfig({ basename: "/app", ai: true });
    expect(merged.basename).toBe("/app");
    expect(merged.ai).toBe(true);
  });

  it("lowercases + trims + dedupes devSubdomains", () => {
    const merged = mergeConfig({
      devSubdomains: ["  Admin ", "admin", "Tenant-Alpha", ""],
    });
    expect(merged.devSubdomains).toEqual(["admin", "tenant-alpha"]);
  });

  it("shallow-merges the prerender block", () => {
    const merged = mergeConfig({ prerender: { outputDir: "build" } });
    // `enabled: true` comes from the default — the user only set
    // `outputDir`.
    expect(merged.prerender).toEqual({ enabled: true, outputDir: "build" });
  });

  it("drops empty strings from devSubdomains", () => {
    const merged = mergeConfig({ devSubdomains: ["", "   ", "valid"] });
    expect(merged.devSubdomains).toEqual(["valid"]);
  });
});
