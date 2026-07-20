/**
 * @file merge-config.spec.ts
 * @module @stackra/storage/test/unit
 * @description `mergeConfig` returns the merged shape used by
 *   `StorageModule.forRoot` — defaults kept when user options are
 *   partial, user-supplied stores override same-named defaults.
 */

import { describe, it, expect } from "vitest";

import { DEFAULT_STORAGE_CONFIG } from "@/core/constants/default-storage-config.constant";
import { mergeConfig } from "@/core/utils/merge-config.util";

describe("mergeConfig", () => {
  it("returns the defaults when called with no argument", () => {
    const merged = mergeConfig();
    expect(merged).toEqual(DEFAULT_STORAGE_CONFIG);
  });

  it("respects the caller-supplied default instance name", () => {
    const merged = mergeConfig({
      default: "preferences",
      stores: { preferences: { driver: "localStorage" } },
    });
    expect(merged.default).toBe("preferences");
  });

  it("layers user stores over the built-in memory default", () => {
    const merged = mergeConfig({
      default: "local",
      stores: {
        local: { driver: "localStorage", prefix: "app:local" },
      },
    });

    // Memory default kept — user didn't touch it.
    expect(merged.stores.memory).toEqual({ driver: "memory" });
    // User's store present.
    expect(merged.stores.local).toEqual({ driver: "localStorage", prefix: "app:local" });
  });

  it("lets a user-supplied same-named store REPLACE the default", () => {
    const merged = mergeConfig({
      default: "memory",
      stores: {
        memory: { driver: "null" },
      },
    });
    expect(merged.stores.memory).toEqual({ driver: "null" });
  });
});
