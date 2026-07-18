/**
 * @file env-enum.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `env.enum(key, allowed, defaultValue?)`.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConfigEnvInvalidError, env } from "@/core";

describe("env.enum()", () => {
  beforeEach(() => {
    delete process.env.TEST_NODE_ENV;
  });

  afterEach(() => {
    delete process.env.TEST_NODE_ENV;
  });

  it("returns the value when it is in the allowed list", () => {
    process.env.TEST_NODE_ENV = "production";
    const result = env.enum("TEST_NODE_ENV", ["development", "production", "test"]);
    expect(result).toBe("production");
  });

  it("throws ConfigEnvInvalidError when the value is outside the allowed list", () => {
    process.env.TEST_NODE_ENV = "staging";
    // The three-source resolver falls through to `env.enum`, which
    // sees 'staging' and rejects it — the throw path.
    expect(() => env.enum("TEST_NODE_ENV", ["development", "production", "test"])).toThrow(
      ConfigEnvInvalidError,
    );
  });

  it("applies the default when the variable is unset", () => {
    const result = env.enum("TEST_NODE_ENV", ["development", "production", "test"], "development");
    expect(result).toBe("development");
  });

  it("throws with a message naming the key and the allowed list", () => {
    process.env.TEST_NODE_ENV = "invalid";
    try {
      env.enum("TEST_NODE_ENV", ["a", "b", "c"]);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigEnvInvalidError);
      expect((err as Error).message).toContain("TEST_NODE_ENV");
      expect((err as Error).message).toContain("a, b, c");
      expect((err as ConfigEnvInvalidError).code).toBe("CONFIG_ENV_INVALID");
    }
  });
});
