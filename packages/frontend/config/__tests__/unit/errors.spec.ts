/**
 * @file errors.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for the error family — every subclass
 *   extends `ConfigError` (single-catch discriminator) and pins its
 *   own stable `code`.
 */

import { describe, expect, it } from "vitest";

import {
  ConfigEnvInvalidError,
  ConfigEnvMissingError,
  ConfigError,
  ConfigMissingKeyError,
  ConfigReadonlyError,
  ConfigValidationError,
} from "@/core";

describe("ConfigError family", () => {
  it("ConfigError has a default code of CONFIG_ERROR", () => {
    const err = new ConfigError("base");
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ConfigError");
  });

  it("ConfigMissingKeyError extends ConfigError with code CONFIG_MISSING_KEY", () => {
    const err = new ConfigMissingKeyError("some.path");
    expect(err).toBeInstanceOf(ConfigError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("CONFIG_MISSING_KEY");
    expect(err.message).toContain("some.path");
  });

  it("ConfigReadonlyError extends ConfigError with code CONFIG_READONLY", () => {
    const err = new ConfigReadonlyError("some.path");
    expect(err).toBeInstanceOf(ConfigError);
    expect(err.code).toBe("CONFIG_READONLY");
    expect(err.message).toContain("some.path");
  });

  it("ConfigValidationError extends ConfigError with code CONFIG_VALIDATION", () => {
    const err = new ConfigValidationError("bad shape");
    expect(err).toBeInstanceOf(ConfigError);
    expect(err.code).toBe("CONFIG_VALIDATION");
    expect(err.message).toContain("bad shape");
  });

  it("ConfigValidationError preserves the cause on Error.cause", () => {
    const cause = new TypeError("inner");
    const err = new ConfigValidationError("wrapped", cause);
    // Node 16.9+ / modern browsers — `Error.cause` is standard.
    expect((err as Error & { cause?: unknown }).cause).toBe(cause);
  });

  it("ConfigEnvMissingError extends ConfigError with code CONFIG_ENV_MISSING", () => {
    const err = new ConfigEnvMissingError("MY_KEY");
    expect(err).toBeInstanceOf(ConfigError);
    expect(err.code).toBe("CONFIG_ENV_MISSING");
    expect(err.message).toContain("MY_KEY");
  });

  it("ConfigEnvInvalidError extends ConfigError with code CONFIG_ENV_INVALID", () => {
    const err = new ConfigEnvInvalidError("MY_KEY", "must be one of: a, b");
    expect(err).toBeInstanceOf(ConfigError);
    expect(err.code).toBe("CONFIG_ENV_INVALID");
    expect(err.message).toContain("MY_KEY");
    expect(err.message).toContain("must be one of: a, b");
  });

  it("every subclass is catchable via a single instanceof ConfigError", () => {
    const errors: ConfigError[] = [
      new ConfigMissingKeyError("a"),
      new ConfigReadonlyError("a"),
      new ConfigValidationError("a"),
      new ConfigEnvMissingError("a"),
      new ConfigEnvInvalidError("a", "b"),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(ConfigError);
      // Also `Error` — the base class extends `Error`.
      expect(err).toBeInstanceOf(Error);
    }
  });
});
