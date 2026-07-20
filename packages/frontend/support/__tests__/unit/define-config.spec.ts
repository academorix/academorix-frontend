/**
 * @file define-config.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural + type-preservation spec for the
 *   `defineConfig<T>(config)` deprecation shim. The runtime is a
 *   pure identity that emits a one-time `console.warn` on first
 *   call, so the assertions cover:
 *
 *     1. Reference equality — the returned value IS the argument.
 *     2. No mutation — arrays / objects / nested records pass through
 *        untouched.
 *     3. Warn-once behaviour — the first call emits a
 *        `[@stackra/support] defineConfig is deprecated ...`
 *        `console.warn`; subsequent calls in the same module load
 *        are silent.
 *     4. Type inference — the generic preserves the literal caller
 *        shape (asserted via `expectTypeOf`).
 *
 *   `vi.resetModules()` is used between tests to reset the shim's
 *   module-scope `warned` flag by re-importing the module — that's
 *   more robust than relying on test ordering.
 */

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

describe("defineConfig (deprecation shim)", () => {
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
    // between tests — otherwise the first spec that runs would
    // silence every subsequent assertion.
    vi.resetModules();
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.warn = originalWarn;
  });

  describe("runtime — pure identity", () => {
    it("returns the same reference as passed in", async () => {
      const { defineConfig } = await import("@/utils/define-config.util");
      const input = { port: 3000, host: "localhost" };
      const output = defineConfig(input);

      // Not just deep-equal — the SAME reference.
      expect(output).toBe(input);
    });

    it("does not mutate the passed object", async () => {
      const { defineConfig } = await import("@/utils/define-config.util");
      const input = { port: 3000, host: "localhost" };
      const snapshot = { ...input };
      defineConfig(input);

      expect(input).toEqual(snapshot);
    });

    it("handles primitives, arrays, and nested records without transformation", async () => {
      const { defineConfig } = await import("@/utils/define-config.util");
      // `undefined` is a valid generic — identity must not coerce it.
      expect(defineConfig(undefined)).toBeUndefined();
      // Primitives pass through by value.
      expect(defineConfig(42)).toBe(42);
      expect(defineConfig("config")).toBe("config");

      const arr = [1, 2, 3];
      expect(defineConfig(arr)).toBe(arr);

      const nested = { a: { b: { c: 1 } } };
      expect(defineConfig(nested)).toBe(nested);
      // The nested object is the SAME reference too — no cloning.
      expect(defineConfig(nested).a).toBe(nested.a);
    });
  });

  describe("deprecation warning", () => {
    it("emits a console.warn on first call", async () => {
      const { defineConfig } = await import("@/utils/define-config.util");
      defineConfig({ any: "thing" });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("@stackra/support");
      expect(message).toContain("defineConfig");
      expect(message).toContain("deprecated");
      expect(message).toContain("registerAs");
      expect(message).toContain("@stackra/config");
    });

    it("does not re-emit on subsequent calls (warn-once semantics)", async () => {
      const { defineConfig } = await import("@/utils/define-config.util");
      defineConfig({ first: 1 });
      defineConfig({ second: 2 });
      defineConfig({ third: 3 });

      // Only the first call fires the notice — the module-scope
      // `warned` flag latches after that.
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("is fail-soft when console.warn is unavailable", async () => {
      // Simulate a toolchain that stripped `console.warn` — the
      // shim guards the call so it never crashes user code.
      const noWarn = { ...console };
      delete (noWarn as unknown as { warn?: unknown }).warn;
      // eslint-disable-next-line no-console
      console.warn = undefined as unknown as typeof console.warn;

      vi.resetModules();
      const { defineConfig } = await import("@/utils/define-config.util");

      // No throw despite `console.warn` being undefined.
      expect(() => defineConfig({ ok: true })).not.toThrow();
      expect(defineConfig({ ok: true })).toEqual({ ok: true });
    });
  });

  describe("type — inference preserved", () => {
    it("narrows the return type to the caller literal", async () => {
      const { defineConfig } = await import("@/utils/define-config.util");
      // The literal shape flows through the generic — TS sees the
      // exact object type, not a widened `Record<string, unknown>`.
      const cfg = defineConfig({ port: 3000, host: "localhost" });

      // Compile-time assertion.
      expectTypeOf(cfg).toEqualTypeOf<{ port: number; host: string }>();
    });

    it("honours an explicit generic parameter", async () => {
      interface AppOptions {
        readonly port: number;
        readonly host?: string;
      }

      const { defineConfig } = await import("@/utils/define-config.util");
      const cfg = defineConfig<AppOptions>({ port: 3000 });
      expectTypeOf(cfg).toEqualTypeOf<AppOptions>();
    });
  });
});
