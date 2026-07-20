/**
 * @file define-config-shim.spec.ts
 * @module @stackra/container/__tests__/unit
 * @description Behavioural spec for the `defineConfig` deprecation
 *   shim shipped by `@stackra/container`. Covers runtime identity,
 *   warn-once semantics, and type inference.
 *
 *   Unlike the other feature-package shims, `@stackra/container`
 *   does NOT re-export `registerAs` from `@stackra/config`. The
 *   config package peer-deps `container`, so a `container -> config`
 *   dep would be circular. Consumers of the container shim must
 *   import `registerAs` from `@stackra/config` directly.
 */

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

interface AppOptions {
  readonly port: number;
  readonly host?: string;
}

describe("defineConfig (@stackra/container — deprecation shim)", () => {
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
      const input = { port: 3000, host: "localhost" };
      const output = defineConfig(input);

      expect(output).toBe(input);
    });

    it("does not mutate the passed object", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const input = { port: 3000, host: "localhost" };
      const snapshot = { ...input };
      defineConfig(input);

      expect(input).toEqual(snapshot);
    });

    it("handles arbitrary shapes (untyped generic)", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");

      expect(defineConfig({ a: 1 })).toEqual({ a: 1 });
      expect(defineConfig([1, 2, 3])).toEqual([1, 2, 3]);
      expect(defineConfig("str")).toBe("str");
    });
  });

  describe("deprecation warning", () => {
    it("emits a console.warn on first call", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      defineConfig({ any: "thing" });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("@stackra/container");
      expect(message).toContain("defineConfig");
      expect(message).toContain("deprecated");
      expect(message).toContain("registerAs");
      expect(message).toContain("@stackra/config");
    });

    it("does not re-emit on subsequent calls (warn-once semantics)", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      defineConfig({ first: 1 });
      defineConfig({ second: 2 });
      defineConfig({ third: 3 });

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("no registerAs re-export (circular dep)", () => {
    it("the shim file does NOT re-export `registerAs`", async () => {
      const mod = await import("@/core/utils/define-config.util");
      // Container sits below @stackra/config in the workspace dep
      // graph — the re-export is intentionally omitted.
      expect((mod as Record<string, unknown>).registerAs).toBeUndefined();
    });
  });

  describe("type — inference preserved", () => {
    it("preserves the caller literal type", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const cfg = defineConfig({ port: 3000, host: "localhost" });

      expectTypeOf(cfg).toEqualTypeOf<{ port: number; host: string }>();
    });

    it("honours an explicit generic parameter", async () => {
      const { defineConfig } = await import("@/core/utils/define-config.util");
      const cfg = defineConfig<AppOptions>({ port: 3000 });
      expectTypeOf(cfg).toEqualTypeOf<AppOptions>();
    });
  });
});
