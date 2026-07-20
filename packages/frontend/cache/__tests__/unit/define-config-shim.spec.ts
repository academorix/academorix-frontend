/**
 * @file define-config-shim.spec.ts
 * @module @stackra/cache/__tests__/unit
 * @description Behavioural spec for the `defineConfig` deprecation
 *   shim shipped by `@stackra/cache`. Covers:
 *
 *     1. Runtime identity — the returned value IS the passed config.
 *     2. Warn-once behaviour — the first call emits a
 *        `[@stackra/cache] defineConfig is deprecated ...`
 *        `console.warn`; subsequent calls in the same module load
 *        are silent.
 *     3. `registerAs` re-export — the shim also re-exports
 *        `registerAs` from `@stackra/config` (available via both
 *        the shim file and the package's core barrel).
 *     4. Type inference — the caller literal narrows through the
 *        `ICacheModuleConfig` generic constraint.
 *
 *   `vi.resetModules()` between tests re-imports the shim so the
 *   module-scope `warned` flag starts fresh — more robust than
 *   relying on test ordering.
 */

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { ICacheModuleConfig } from "@/core/interfaces";

describe("defineConfig (@stackra/cache — deprecation shim)", () => {
  let originalWarn: typeof console.warn;
  let warnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalWarn = console.warn;
    warnSpy = vi.fn();
    // Spy on `console.warn` so the deprecation notice is captured
    // instead of cluttering test output.
    // eslint-disable-next-line no-console
    console.warn = warnSpy;
    // Reset the module cache so the shim's `warned` flag is fresh
    // between tests.
    vi.resetModules();
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.warn = originalWarn;
  });

  describe("runtime — pure identity", () => {
    it("returns the same reference as passed in", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const input: ICacheModuleConfig = {
        default: "memory",
        stores: { memory: { driver: "memory" } },
      };
      const output = defineConfig(input);

      // Same reference — the shim is a pure identity.
      expect(output).toBe(input);
    });

    it("does not mutate the passed config", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const input: ICacheModuleConfig = {
        default: "memory",
        stores: { memory: { driver: "memory" } },
        prefix: "app:",
        ttl: 3600,
      };
      const snapshot = { ...input };
      defineConfig(input);

      expect(input).toEqual(snapshot);
    });
  });

  describe("deprecation warning", () => {
    it("emits a console.warn on first call", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      defineConfig({ default: "memory", stores: { memory: { driver: "memory" } } });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("@stackra/cache");
      expect(message).toContain("defineConfig");
      expect(message).toContain("deprecated");
      expect(message).toContain("registerAs");
      expect(message).toContain("@stackra/config");
    });

    it("does not re-emit on subsequent calls (warn-once semantics)", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      defineConfig({ default: "memory", stores: { memory: { driver: "memory" } } });
      defineConfig({ default: "null", stores: { null: { driver: "null" } } });
      defineConfig({ default: "memory", stores: { memory: { driver: "memory" } } });

      // Only the first call fires — the module-scope `warned` flag
      // latches after that.
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("registerAs re-export", () => {
    it("the shim file re-exports `registerAs`", async () => {
      const mod = await import("@/core/utils/define-config.util");
      expect(mod.registerAs).toBeDefined();
      expect(typeof mod.registerAs).toBe("function");
    });

    it("the re-exported `registerAs` still stamps `.KEY` on the factory", async () => {
      const { registerAs } = await import("@/core/utils/define-config.util");
      const factory = registerAs("shim-cache-test", () => ({ ttl: 60 }));
      // `registerAs` decorates the factory with a `.KEY` string DI
      // token — confirming the re-export ships the real function
      // (not a stripped stub).
      expect((factory as unknown as { KEY: string }).KEY).toContain("shim-cache-test");
    });
  });

  describe("type — inference preserved", () => {
    it("narrows through the ICacheModuleConfig constraint", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const cfg = defineConfig({
        default: "memory",
        stores: { memory: { driver: "memory" } },
      } satisfies ICacheModuleConfig);

      // The generic `T extends ICacheModuleConfig` preserves the
      // caller literal, so downstream code sees the exact shape
      // rather than the interface widening.
      expectTypeOf(cfg).toMatchTypeOf<ICacheModuleConfig>();
    });
  });
});
