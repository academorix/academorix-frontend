/**
 * @file http-error.test.ts
 * @module @academorix/core/errors/__tests__/http-error.test
 *
 * @description
 * Tests for {@link HttpError} + {@link isHttpError}. Verifies:
 *
 *  - The constructor wires every field onto the instance.
 *  - `fromEnvelope` lifts `message` / `errors` off the body while
 *    retaining the raw body on `.body`, and provides a status-based
 *    fallback message when the envelope lacks one.
 *  - `isHttpError` narrows correctly and rejects plain-shape lookalikes.
 *  - The class actually extends `Error` (instance chain + `.name`).
 */

import { describe, expect, it } from "vitest";

import { HttpError, isHttpError } from "../http-error";

describe("new HttpError()", () => {
  it("wires message, statusCode, errors, and body onto the instance", () => {
    const errors = { email: ["The email has already been taken."] };
    const body = { message: "Invalid", errors };

    const error = new HttpError("Invalid", 422, errors, body);

    expect(error.message).toBe("Invalid");
    expect(error.statusCode).toBe(422);
    expect(error.errors).toEqual(errors);
    expect(error.body).toBe(body);
  });

  it("allows optional fields to be omitted", () => {
    const error = new HttpError("Network unreachable");

    expect(error.message).toBe("Network unreachable");
    expect(error.statusCode).toBeUndefined();
    expect(error.errors).toBeUndefined();
    expect(error.body).toBeUndefined();
  });

  it("sets error.name to 'HttpError'", () => {
    const error = new HttpError("Boom", 500);

    expect(error.name).toBe("HttpError");
  });

  it("extends the built-in Error class", () => {
    const error = new HttpError("Boom", 500);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
  });

  it("captures a stack trace like a regular Error", () => {
    const error = new HttpError("Traceable", 500);

    expect(typeof error.stack).toBe("string");
    expect(error.stack).toContain("HttpError");
  });
});

describe("HttpError.fromEnvelope()", () => {
  it("lifts body.message and body.errors onto the instance", () => {
    const body = {
      message: "The given data was invalid.",
      errors: {
        email: ["The email has already been taken."],
        password: ["The password field is required."],
      },
    };

    const error = HttpError.fromEnvelope(422, body);

    expect(error.message).toBe("The given data was invalid.");
    expect(error.statusCode).toBe(422);
    expect(error.errors).toEqual(body.errors);
    expect(error.body).toBe(body);
  });

  it("falls back to a status-based message when the envelope has none", () => {
    const error = HttpError.fromEnvelope(500, {});

    expect(error.message).toBe("Request failed with status 500.");
    expect(error.statusCode).toBe(500);
  });

  it("keeps the raw body accessible even when message is missing", () => {
    const body: { note: string } = { note: "raw payload" };

    const error = HttpError.fromEnvelope(500, body as { message?: string });

    expect(error.body).toBe(body);
  });

  it("returns an instance of HttpError", () => {
    const error = HttpError.fromEnvelope(400, { message: "bad" });

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("isHttpError()", () => {
  it("returns true for HttpError instances", () => {
    const error = new HttpError("nope", 400);

    expect(isHttpError(error)).toBe(true);
  });

  it("returns true for instances built via fromEnvelope", () => {
    const error = HttpError.fromEnvelope(422, { message: "bad" });

    expect(isHttpError(error)).toBe(true);
  });

  it("returns false for plain objects with the same shape", () => {
    const lookalike = {
      name: "HttpError",
      message: "nope",
      statusCode: 400,
      errors: undefined,
      body: undefined,
    };

    expect(isHttpError(lookalike)).toBe(false);
  });

  it("returns false for a regular Error", () => {
    expect(isHttpError(new Error("plain"))).toBe(false);
  });

  it("returns false for null / undefined / primitives", () => {
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
    expect(isHttpError("HttpError")).toBe(false);
    expect(isHttpError(42)).toBe(false);
  });

  it("narrows unknown to HttpError at the type level", () => {
    const caught: unknown = new HttpError("nope", 400);

    if (isHttpError(caught)) {
      // TypeScript should let us access statusCode here.
      expect(caught.statusCode).toBe(400);
    } else {
      throw new Error("Expected isHttpError to narrow to true");
    }
  });
});
