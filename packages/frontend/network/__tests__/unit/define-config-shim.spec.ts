/**
 * @file define-config-shim.spec.ts
 * @module @stackra/network/__tests__/unit
 * @description Behavioural spec for the `defineConfig` deprecation
 *   shim shipped by `@stackra/network`. Covers runtime identity,
 *   warn-once semantics, `registerAs` re-export, and type inference.
 */

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { NetworkModuleOptions } from "@/core/interfaces";

describe("defineConfig (@stackra/network — deprecation shim)", () => {
  let originalWarn: typeof console.warn;
  let warnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalWarn = console.warn;
    warnSpy = vi.fn();
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
      const input: NetworkModuleOptions = { global: true, logging: "info" };
      const output = defineConfig(input);

      expect(output).toBe(input);
    });

    it("does not mutate the passed config", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const input: NetworkModuleOptions = { global: false, logging: "debug" };
      const snapshot = { ...input };
      defineConfig(input);

      expect(input).toEqual(snapshot);
    });
  });

  describe("deprecation warning", () => {
    it("emits a console.warn on first call", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      defineConfig({ global: true });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("@stackra/network");
      expect(message).toContain("defineConfig");
      expect(message).toContain("deprecated");
      expect(message).toContain("registerAs");
      expect(message).toContain("@stackra/config");
    });

    it("does not re-emit on subsequent calls (warn-once semantics)", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      defineConfig({ global: true });
      defineConfig({ global: false });
      defineConfig({ logging: "silent" });

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
      const factory = registerAs("shim-network-test", () => ({ global: true }));
      expect((factory as unknown as { KEY: string }).KEY).toContain("shim-network-test");
    });
  });

  describe("type — inference preserved", () => {
    it("narrows through the NetworkModuleOptions constraint", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const cfg = defineConfig({
        global: true,
        logging: "info",
      } satisfies NetworkModuleOptions);

      expectTypeOf(cfg).toMatchTypeOf<NetworkModuleOptions>();
    });
  });
});
