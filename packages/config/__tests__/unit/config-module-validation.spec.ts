/**
 * @file config-module-validation.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `ConfigModule.forRoot({ validate })` and
 *   `ConfigModule.forRoot({ validationSchema })` — success + failure
 *   paths.
 *
 *   The Joi tests conditionally import — `joi` is an optional peer
 *   dep. In workspaces without joi installed, the spec skips those
 *   cases rather than fail.
 */

import { describe, expect, it } from "vitest";

import { ConfigModule, ConfigValidationError } from "@/core";

describe("ConfigModule.forRoot({ validate })", () => {
  it("accepts a passing custom validator", async () => {
    // The validator returns a shape — success path.
    const dynamic = await ConfigModule.forRoot({
      validate: (raw) => ({ ...raw, VALIDATED: "yes" }),
    });
    expect(dynamic.module).toBe(ConfigModule);
  });

  it("wraps a throwing validator into ConfigValidationError", async () => {
    // The validator throws — should surface as our error class,
    // not the raw error.
    await expect(
      ConfigModule.forRoot({
        validate: () => {
          throw new Error("bad shape");
        },
      }),
    ).rejects.toThrow(ConfigValidationError);
  });

  it("preserves the underlying cause on Error.cause", async () => {
    const inner = new Error("inner reason");
    try {
      await ConfigModule.forRoot({
        validate: () => {
          throw inner;
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      expect((err as Error & { cause?: unknown }).cause).toBe(inner);
    }
  });
});

describe("ConfigModule.forRoot({ validationSchema }) — Joi", () => {
  it("accepts a passing Joi schema", async () => {
    let joi: typeof import("joi");
    try {
      joi = await import("joi");
    } catch {
      // Joi not installed — skip.
      return;
    }
    const schema = joi.object({
      NODE_ENV: joi.string().valid("development", "production", "test").default("development"),
    });
    const dynamic = await ConfigModule.forRoot({ validationSchema: schema });
    expect(dynamic.module).toBe(ConfigModule);
  });

  it("throws ConfigValidationError on a failing Joi schema", async () => {
    let joi: typeof import("joi");
    try {
      joi = await import("joi");
    } catch {
      return;
    }
    const schema = joi.object({
      REQUIRED_KEY: joi.string().required(),
    });
    // No `REQUIRED_KEY` in process.env → Joi validation fails.
    await expect(
      ConfigModule.forRoot({
        // ignoreEnvFile so we don't accidentally load a real .env
        // during the test.
        ignoreEnvFile: true,
        validationSchema: schema,
      }),
    ).rejects.toThrow(ConfigValidationError);
  });
});
