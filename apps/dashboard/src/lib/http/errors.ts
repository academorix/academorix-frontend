/**
 * @file errors.ts
 * @module lib/http/errors
 *
 * @description
 * Normalises every failure mode (non-2xx responses, network errors, JSON parse
 * failures) into a single {@link ApiError} that satisfies Refine's `HttpError`
 * contract (`{ message, statusCode, errors? }`).
 *
 * Refine hooks read `error.statusCode` (e.g. to trigger `authProvider.onError`
 * on 401/403) and `error.errors` (to surface field-level validation messages
 * in forms), so producing this exact shape everywhere keeps the data layer and
 * UI behaviour consistent between the REST and mock providers.
 */

import type { ApiValidationErrorResponse } from "@/types/api";
import type { HttpError } from "@refinedev/core";

/**
 * Refine's `ValidationErrors` accepts `string | string[]` per field. Laravel's
 * 422 payload already uses `string[]`, so we pass it straight through.
 */
type FieldErrors = HttpError["errors"];

/**
 * Concrete error thrown by the HTTP + data layers. Implements Refine's
 * `HttpError` so it can be thrown from any provider method and rendered by any
 * Refine hook without further mapping.
 */
export class ApiError extends Error implements HttpError {
  /** HTTP status code (or `0` for network/transport failures). */
  readonly statusCode: number;
  /** Field-level validation errors, when the server returned any (422). */
  readonly errors?: FieldErrors;
  /** Raw parsed response body, retained for debugging/telemetry. */
  readonly body?: unknown;

  constructor(message: string, statusCode: number, errors?: FieldErrors, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.body = body;

    // Restore the prototype chain for `instanceof` after transpilation to ES5.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/** Type guard: is this value a Laravel 422 validation payload? */
function isValidationPayload(value: unknown): value is ApiValidationErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "errors" in value &&
    typeof (value as { errors: unknown }).errors === "object"
  );
}

/**
 * Builds an {@link ApiError} from a failed `Response`, best-effort parsing the
 * body for a message and field errors. Never throws — always resolves to an
 * `ApiError`, so callers can `throw await toApiError(response)` safely.
 *
 * @param response - The non-2xx fetch `Response`.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown;

  try {
    // Clone so the caller could still read the original stream if needed.
    body = await response.clone().json();
  } catch {
    body = undefined;
  }

  const fallback = `Request failed with status ${response.status}`;

  if (isValidationPayload(body)) {
    return new ApiError(body.message || fallback, response.status, body.errors, body);
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : fallback;

  return new ApiError(message, response.status, undefined, body);
}

/**
 * Wraps a transport-level failure (DNS, offline, CORS, abort) — where there is
 * no HTTP status at all — as an {@link ApiError} with `statusCode: 0`.
 *
 * @param cause - The original thrown value from `fetch`.
 */
export function toNetworkError(cause: unknown): ApiError {
  const message = cause instanceof Error ? cause.message : "Network request failed";

  return new ApiError(message, 0, undefined, cause);
}
