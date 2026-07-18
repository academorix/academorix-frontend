/**
 * @file deprecation-shim.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for the `defineConfig` deprecation shim —
 *   verifies the alias delegates to `registerAs` (tagged form) and
 *   emits a one-time `console.warn`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("defineConfig (deprecated alias)", () => {
  let originalWarn: typeof console.warn;
  let warnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalWarn = console.warn;
    warnSpy = vi.fn();
    // Spy on console.warn — the shim fires a deprecation notice on
    // first call. We don't want the notice cluttering test output.
    // eslint-disable-next-line no-console
    console.warn = warnSpy;
    // Clear the module cache so the shim's internal `warned` flag
    // resets between test cases.
    vi.resetModules();
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.warn = originalWarn;
  });

  it("identity overload — returns the passed object unchanged", async () => {
    const { defineConfig } = await import("@/core");
    const cfg = { port: 3000 };
    expect(defineConfig(cfg)).toBe(cfg);
  });

  it("tagged overload — delegates to registerAs (stamps .KEY)", async () => {
    const { defineConfig } = await import("@/core");
    const factory = defineConfig("shim-test", () => ({ ttl: 60 }));
    // The result must carry the `.KEY` stamp from `registerAs`.
    expect((factory as unknown as { KEY: string }).KEY).toContain("shim-test");
  });

  it("emits console.warn on first call", async () => {
    const { defineConfig } = await import("@/core");
    defineConfig({ any: "thing" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain("defineConfig");
    expect(message).toContain("registerAs");
  });

  it("does not re-emit on subsequent calls", async () => {
    const { defineConfig } = await import("@/core");
    defineConfig({ first: 1 });
    defineConfig({ second: 2 });
    defineConfig({ third: 3 });
    // Only the first call fires the warning.
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
