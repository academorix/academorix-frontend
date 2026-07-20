/**
 * @file merge-config.test.ts
 * @module @stackra/realtime/__tests__/unit
 * @description Behavioural tests for `mergeConfig()` — currently an
 *   identity passthrough over `DEFAULT_REALTIME_CONFIG` (empty object).
 *   Guard against silent drift.
 */

import { describe, it, expect } from "vitest";
import { mergeConfig } from "@/core/utils/merge-config.util";
import { DEFAULT_REALTIME_CONFIG } from "@/core/constants";

describe("mergeConfig", () => {
  it("passes user options through unchanged", () => {
    const options = {
      default: "main",
      connections: {
        main: { driver: "socketio", url: "wss://x" },
      },
    };

    const merged = mergeConfig(options);
    expect(merged.default).toBe("main");
    expect(merged.connections).toEqual({
      main: { driver: "socketio", url: "wss://x" },
    });
  });

  it("overlays user options on top of DEFAULT_REALTIME_CONFIG", () => {
    // DEFAULT is empty today; adding this test locks the merge order in place
    // so if defaults appear later, user options still override them.
    const merged = mergeConfig({
      default: "main",
      connections: {},
    });
    expect(merged.default).toBe("main");
  });

  it("does not mutate DEFAULT_REALTIME_CONFIG", () => {
    const before = { ...DEFAULT_REALTIME_CONFIG };
    mergeConfig({
      default: "main",
      connections: { main: { driver: "x" } },
    });
    expect(DEFAULT_REALTIME_CONFIG).toEqual(before);
  });

  it("preserves the emitLifecycleEvents flag", () => {
    const merged = mergeConfig({
      default: "main",
      connections: { main: { driver: "test" } },
      emitLifecycleEvents: false,
    });
    expect(merged.emitLifecycleEvents).toBe(false);
  });
});
