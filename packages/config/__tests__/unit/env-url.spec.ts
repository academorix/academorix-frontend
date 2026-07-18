/**
 * @file env-url.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `env.url(key, defaultValue?)`.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConfigEnvInvalidError, env } from "@/core";

describe("env.url()", () => {
  beforeEach(() => {
    delete process.env.TEST_URL;
  });

  afterEach(() => {
    delete process.env.TEST_URL;
  });

  it("parses a valid URL", () => {
    process.env.TEST_URL = "https://example.com/path";
    const url = env.url("TEST_URL");
    expect(url).toBeInstanceOf(URL);
    expect(url.hostname).toBe("example.com");
    expect(url.pathname).toBe("/path");
  });

  it("throws ConfigEnvInvalidError on invalid input", () => {
    process.env.TEST_URL = "not-a-url";
    expect(() => env.url("TEST_URL")).toThrow(ConfigEnvInvalidError);
  });

  it("parses the default when the variable is unset", () => {
    const url = env.url("TEST_URL", "https://default.example.com");
    expect(url).toBeInstanceOf(URL);
    expect(url.hostname).toBe("default.example.com");
  });

  it("throws with a message naming the key and the invalid value", () => {
    process.env.TEST_URL = "not-a-url";
    try {
      env.url("TEST_URL");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigEnvInvalidError);
      expect((err as Error).message).toContain("TEST_URL");
      expect((err as Error).message).toContain("not-a-url");
    }
  });
});
