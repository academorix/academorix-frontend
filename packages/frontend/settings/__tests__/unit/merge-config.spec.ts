/**
 * @file merge-config.spec.ts
 * @description Unit tests for `mergeConfig` — verifies defaults are
 *   applied and nested user overrides merge correctly.
 */

import { describe, it, expect } from "vitest";

import { mergeConfig, DEFAULT_SETTINGS_CONFIG } from "@/core";

describe("mergeConfig", () => {
  it("returns defaults verbatim when no options are supplied", () => {
    expect(mergeConfig()).toBe(DEFAULT_SETTINGS_CONFIG);
  });

  it("overrides scalar fields", () => {
    const config = mergeConfig({
      default: "memory",
      prefix: "app:",
      debounceMs: 500,
    });
    expect(config.default).toBe("memory");
    expect(config.prefix).toBe("app:");
    expect(config.debounceMs).toBe(500);
    // Defaults preserved for fields not overridden.
    expect(config.debounce).toBe(DEFAULT_SETTINGS_CONFIG.debounce);
  });

  it("shallow-replaces stores when the user provides a map", () => {
    const stores = {
      memory: { driver: "memory" as const },
      api: { driver: "api" as const, baseUrl: "https://api.example.com" },
    };
    const config = mergeConfig({ stores });
    expect(config.stores).toEqual(stores);
  });

  it("deep-merges api.endpoints so callers can override one path", () => {
    const config = mergeConfig({
      api: { endpoints: { schema: "/custom/schema" } },
    });
    expect(config.api.endpoints.schema).toBe("/custom/schema");
    // Other endpoint defaults are preserved.
    expect(config.api.endpoints.getGroup).toBe(DEFAULT_SETTINGS_CONFIG.api.endpoints.getGroup);
  });

  it("deep-merges broadcasting so callers can flip one flag", () => {
    const config = mergeConfig({
      broadcasting: { enabled: true },
    });
    expect(config.broadcasting.enabled).toBe(true);
    expect(config.broadcasting.channelPrefix).toBe(
      DEFAULT_SETTINGS_CONFIG.broadcasting.channelPrefix,
    );
  });

  it("passes groups through unchanged when absent", () => {
    expect(mergeConfig({}).groups).toBeUndefined();
  });
});
