/**
 * @file config-service-describe.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `ConfigService.describe()` — the
 *   Stackra-added snapshot API. Full flatten + regex redaction.
 */

import { describe, expect, it } from "vitest";

import { ConfigService } from "@/core";

describe("ConfigService.describe()", () => {
  it("flattens a nested config into dotted-path entries", () => {
    const service = new ConfigService({
      cache: { prefix: "app:", ttl: 3600 },
      auth: { session_secret: "abc" },
    });
    const snapshot = service.describe();

    expect(snapshot["cache.prefix"]).toEqual({
      value: "app:",
      source: "load",
      isDefault: false,
      path: "cache.prefix",
    });
    expect(snapshot["cache.ttl"]?.value).toBe(3600);
    expect(snapshot["auth.session_secret"]?.value).toBe("abc");
  });

  it("redacts values matching redactedKeys regex patterns", () => {
    const service = new ConfigService({
      auth: { jwt_secret: "super-sensitive" },
      cache: { prefix: "app:" },
    });
    const snapshot = service.describe({ redactedKeys: [/_secret$/i] });

    // Redacted entry — value replaced with the sentinel.
    expect(snapshot["auth.jwt_secret"]?.value).toBe("***REDACTED***");
    // Non-matching entry — value preserved.
    expect(snapshot["cache.prefix"]?.value).toBe("app:");
  });

  it("reports source as `load` for the main config tree", () => {
    const service = new ConfigService({ foo: "bar" });
    const snapshot = service.describe();
    expect(snapshot["foo"]?.source).toBe("load");
  });

  it("reports source as `validated` for values under the validated-env slot", () => {
    const service = new ConfigService({
      foo: "bar",
      __VALIDATED_ENV__: { PORT: "3000" },
    });
    const snapshot = service.describe();
    // The validated slot is walked as a separate source.
    expect(snapshot["PORT"]?.source).toBe("validated");
    // The `__VALIDATED_ENV__` key itself is NOT enumerated as a load
    // entry — it's the meta-slot, not a config value.
    expect(snapshot["__VALIDATED_ENV__"]).toBeUndefined();
  });

  it("preserves the resolved value at every leaf", () => {
    const service = new ConfigService({
      db: { host: "localhost", port: 5432, ssl: true },
    });
    const snapshot = service.describe();
    expect(snapshot["db.host"]?.value).toBe("localhost");
    expect(snapshot["db.port"]?.value).toBe(5432);
    expect(snapshot["db.ssl"]?.value).toBe(true);
  });
});
