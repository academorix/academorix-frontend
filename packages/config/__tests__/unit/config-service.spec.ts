/**
 * @file config-service.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `ConfigService` — the 4 `get()`
 *   overloads, the 4 `getOrThrow()` overloads, dotted-path
 *   resolution, and `set()` semantics.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConfigMissingKeyError, ConfigService } from "@/core";

/**
 * Construct a ConfigService with a pre-populated internal config so
 * we can test resolution without going through `ConfigModule.forRoot`.
 *
 * The service accepts the host record as its first constructor
 * argument (marked `@Optional()` for the DI path; passing it
 * directly is legal for tests).
 */
function makeService<K = Record<string, unknown>>(
  config: Record<string, unknown> = {},
): ConfigService<K> {
  return new ConfigService<K>(config);
}

describe("ConfigService.get() — overloads", () => {
  it("returns undefined for a missing path (no default)", () => {
    const service = makeService({});
    expect(service.get("nonexistent")).toBeUndefined();
  });

  it("returns the loaded value for a top-level key", () => {
    const service = makeService({ port: 3000 });
    expect(service.get("port")).toBe(3000);
  });

  it("resolves a dotted path against the loaded config", () => {
    const service = makeService({ cache: { ttl: 60, prefix: "app:" } });
    expect(service.get("cache.ttl")).toBe(60);
    expect(service.get("cache.prefix")).toBe("app:");
  });

  it("returns the default when the path misses", () => {
    const service = makeService({});
    expect(service.get("missing", 42)).toBe(42);
  });

  it("accepts the { infer: true } options marker without treating it as a default", () => {
    const service = makeService({ known: "value" });
    // The marker itself signals infer-mode; passing it should NOT
    // make the marker object appear as a fallback value.
    expect(service.get("known", { infer: true })).toBe("value");
    expect(service.get("missing", { infer: true })).toBeUndefined();
  });

  it("falls through to process.env for a top-level string key", () => {
    process.env.CONFIG_SERVICE_TEST_KEY = "env-value";
    const service = makeService({});
    expect(service.get("CONFIG_SERVICE_TEST_KEY")).toBe("env-value");
    delete process.env.CONFIG_SERVICE_TEST_KEY;
  });

  it("loaded config wins over process.env", () => {
    process.env.SHARED_KEY = "from-env";
    const service = makeService({ SHARED_KEY: "from-load" });
    expect(service.get("SHARED_KEY")).toBe("from-load");
    delete process.env.SHARED_KEY;
  });
});

describe("ConfigService.getOrThrow()", () => {
  it("returns the value when resolved", () => {
    const service = makeService({ port: 3000 });
    expect(service.getOrThrow("port")).toBe(3000);
  });

  it("throws ConfigMissingKeyError when unresolved", () => {
    const service = makeService({});
    expect(() => service.getOrThrow("nonexistent")).toThrow(ConfigMissingKeyError);
  });

  it("uses the default when supplied (no throw)", () => {
    const service = makeService({});
    expect(service.getOrThrow("missing", 42)).toBe(42);
  });
});

describe("ConfigService.set()", () => {
  it("writes to the internal config", () => {
    const service = makeService({});
    service.set("new.path", "value");
    expect(service.get("new.path")).toBe("value");
  });

  it("writes to process.env in Node runtimes (top-level string key)", () => {
    const service = makeService({});
    service.set("SET_TEST_KEY", "written");
    expect(process.env.SET_TEST_KEY).toBe("written");
    delete process.env.SET_TEST_KEY;
  });

  it("stringifies non-string values when propagating to process.env", () => {
    const service = makeService({});
    service.set("SET_NUM_KEY", 42);
    expect(process.env.SET_NUM_KEY).toBe("42");
    delete process.env.SET_NUM_KEY;
  });
});

describe("ConfigService — skipProcessEnv toggle", () => {
  beforeEach(() => {
    process.env.SKIP_TEST = "env-value";
  });

  afterEach(() => {
    delete process.env.SKIP_TEST;
  });

  it("reads process.env by default", () => {
    const service = makeService({});
    expect(service.get("SKIP_TEST")).toBe("env-value");
  });

  it("skips process.env when the toggle is on", () => {
    const service = makeService({});
    (service as unknown as { skipProcessEnv: boolean }).skipProcessEnv = true;
    expect(service.get("SKIP_TEST")).toBeUndefined();
  });
});
