/**
 * @file normalize.test.ts
 * @module @academorix/http/errors/normalize.test
 *
 * @description
 * Unit tests for the failure-mode normalizers. `toHttpError` should
 * always resolve to an {@link HttpError} regardless of body shape,
 * lifting Laravel's 422 `errors` map when present. `toNetworkError`
 * wraps any transport-level failure with an `HttpError` that carries
 * no `statusCode`.
 */

import { HttpError } from "@academorix/core/errors";
import { describe, expect, it } from "vitest";

import { toHttpError, toNetworkError } from "../normalize.util";

/** Builds a `Response` whose `.clone().json()` resolves to `payload`. */
function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Builds a `Response` whose body is non-JSON so `.json()` will reject. */
function textResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

describe("toHttpError", () => {
  it("lifts errors and message from a Laravel 422 validation payload", async () => {
    const response = jsonResponse(422, {
      message: "The given data was invalid.",
      errors: {
        email: ["The email has already been taken."],
        password: ["The password field is required."],
      },
    });

    const error = await toHttpError(response);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe("The given data was invalid.");
    expect(error.errors).toEqual({
      email: ["The email has already been taken."],
      password: ["The password field is required."],
    });
    expect(error.body).toEqual({
      message: "The given data was invalid.",
      errors: {
        email: ["The email has already been taken."],
        password: ["The password field is required."],
      },
    });
  });

  it("extracts message from a generic { message } body and leaves errors undefined", async () => {
    const response = jsonResponse(404, { message: "Athlete not found." });

    const error = await toHttpError(response);

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Athlete not found.");
    expect(error.errors).toBeUndefined();
  });

  it("falls back to a status-derived message when the body is non-JSON", async () => {
    const response = textResponse(500, "<html>gateway</html>");

    const error = await toHttpError(response);

    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Request failed with status 500");
    expect(error.errors).toBeUndefined();
  });

  it("returns 'Request failed with status <n>' when the body is empty", async () => {
    const response = new Response("", { status: 502 });

    const error = await toHttpError(response);

    expect(error.statusCode).toBe(502);
    expect(error.message).toBe("Request failed with status 502");
  });
});

describe("toNetworkError", () => {
  it("wraps an Error cause as an HttpError with undefined statusCode", () => {
    const cause = new Error("Failed to fetch");

    const error = toNetworkError(cause);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBeUndefined();
    expect(error.message).toBe("Failed to fetch");
    expect(error.body).toBe(cause);
  });

  it("uses a generic message when the cause is not an Error instance", () => {
    const error = toNetworkError("string-cause");

    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBeUndefined();
    expect(error.message).toBe("Network request failed");
    expect(error.body).toBe("string-cause");
  });
});
