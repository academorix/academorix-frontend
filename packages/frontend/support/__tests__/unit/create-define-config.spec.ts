/**
 * @file create-define-config.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `createDefineConfig<TOptions>()`
 *   deprecation shim. The factory returns a fresh identity function
 *   bound to `TOptions` and emits a one-time `console.warn` on
 *   first call. The tests confirm:
 *
 *     1. The factory returns a function.
 *     2. The returned function is a pure identity.
 *     3. Two independently-bound aliases have DIFFERENT reference
 *        identities (so callers that memoise on the helper stay
 *        isolated).
 *     4. Warn-once behaviour — the first `createDefineConfig()`
 *        call emits a `[@stackra/support] createDefineConfig is
 *        deprecated ...` `console.warn`; subsequent calls in the
 *        same module load are silent.
 *     5. The returned identity function does NOT emit its own
 *        warning (that's the per-package shim's job).
 *     6. Type-time — the bound alias narrows to the concrete
 *        `TOptions` (asserted via `expectTypeOf`).
 *
 *   `vi.resetModules()` is used between tests to reset the shim's
 *   module-scope `warned` flag by re-importing the module — that's
 *   more robust than relying on test ordering.
 */

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

interface CacheOptions {
  readonly ttl: number;
  readonly prefix?: string;
}

interface QueueOptions {
  readonly attempts: number;
  readonly delayMs?: number;
}

describe("createDefineConfig (deprecation shim)", () => {
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

  describe("shape", () => {
    it("returns a function", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      expect(typeof defineCacheConfig).toBe("function");
    });

    it("the returned function is a pure identity", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      const input: CacheOptions = { ttl: 60, prefix: "app:" };
      const output = defineCacheConfig(input);

      // Reference equality — the SAME object flows through.
      expect(output).toBe(input);
      // No mutation.
      expect(output).toEqual({ ttl: 60, prefix: "app:" });
    });
  });

  describe("isolation between bound aliases", () => {
    it("two invocations return DIFFERENT function references", async () => {
      // Fresh closures per invocation — two package aliases must
      // not share identity so memoisation keys stay isolated.
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      const defineQueueConfig = createDefineConfig<QueueOptions>();

      expect(defineCacheConfig).not.toBe(defineQueueConfig);
    });

    it("two bound aliases operate on their own captured type without cross-talk", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      const defineQueueConfig = createDefineConfig<QueueOptions>();

      const cache = defineCacheConfig({ ttl: 60 });
      const queue = defineQueueConfig({ attempts: 3 });

      // Each returns exactly what it received.
      expect(cache).toEqual({ ttl: 60 });
      expect(queue).toEqual({ attempts: 3 });
    });
  });

  describe("deprecation warning", () => {
    it("emits a console.warn on first createDefineConfig() call", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      createDefineConfig<CacheOptions>();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("@stackra/support");
      expect(message).toContain("createDefineConfig");
      expect(message).toContain("deprecated");
      expect(message).toContain("registerAs");
      expect(message).toContain("@stackra/config");
    });

    it("does not re-emit on subsequent createDefineConfig() calls", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      createDefineConfig<CacheOptions>();
      createDefineConfig<QueueOptions>();
      createDefineConfig<{ any: string }>();

      // Only the first factory invocation fires — the module-scope
      // `warned` flag latches after that.
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("the returned identity function does NOT warn on its own calls", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      // First factory call emits the notice.
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      expect(warnSpy).toHaveBeenCalledTimes(1);

      // The returned function is used many times — no additional
      // warnings. Doubling here would generate noise; the
      // per-package `defineConfig` alias handles its own warning.
      defineCacheConfig({ ttl: 10 });
      defineCacheConfig({ ttl: 20 });
      defineCacheConfig({ ttl: 30 });

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("is fail-soft when console.warn is unavailable", async () => {
      // Simulate a toolchain that stripped `console.warn` — the
      // shim guards the call so it never crashes user code.
      // eslint-disable-next-line no-console
      console.warn = undefined as unknown as typeof console.warn;

      vi.resetModules();
      const { createDefineConfig } = await import("@/utils/create-define-config.util");

      // No throw despite `console.warn` being undefined.
      expect(() => createDefineConfig<CacheOptions>()).not.toThrow();
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      expect(defineCacheConfig({ ttl: 42 })).toEqual({ ttl: 42 });
    });
  });

  describe("type — bound alias narrows to TOptions", () => {
    it("typed alias enforces the bound shape at compile time", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      expectTypeOf(defineCacheConfig).toEqualTypeOf<(config: CacheOptions) => CacheOptions>();
    });

    it("two aliases have independent parameter types", async () => {
      const { createDefineConfig } = await import("@/utils/create-define-config.util");
      const defineCacheConfig = createDefineConfig<CacheOptions>();
      const defineQueueConfig = createDefineConfig<QueueOptions>();

      expectTypeOf(defineCacheConfig).parameter(0).toEqualTypeOf<CacheOptions>();
      expectTypeOf(defineQueueConfig).parameter(0).toEqualTypeOf<QueueOptions>();
    });
  });
});
