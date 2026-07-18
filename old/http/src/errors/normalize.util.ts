/**
 * @file normalize.util.ts
 * @module @academorix/http/errors/normalize.util
 *
 * @description
 * Normalises every failure mode (non-2xx responses, network errors,
 * JSON parse failures) into a single {@link HttpError} from
 * `@academorix/core/errors`.
 *
 * Refine's hooks read `error.statusCode` (e.g. to trigger
 * `authProvider.onError` on 401/403) and `error.errors` (to surface
 * field-level validation messages in forms), so producing this exact
 * shape everywhere keeps the data layer and UI behaviour consistent
 * whether we're talking to REST or an RPC.
 */

import { HttpError } from "@academorix/core/errors";

/**
 * Laravel's 422 validation payload shape. Every field maps to a list
 * of translated error strings.
 */
interface ValidationErrorPayload {
  message: string;
  errors: Record<string, string[]>;
}

/** Type guard: is this value a Laravel 422 validation payload? */
function isValidationPayload(value: unknown): value is ValidationErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "errors" in value &&
    typeof (value as { errors: unknown }).errors === "object"
  );
}

/**
 * Builds an {@link HttpError} from a failed `Response`, best-effort
 * parsing the body for a message and field errors. Never throws —
 * always resolves to an `HttpError`, so callers can
 * `throw await toHttpError(response)` safely.
 *
 * @param response - The non-2xx fetch `Response`.
 */
export async function toHttpError(response: Response): Promise<HttpError> {
  let body: unknown;

  try {
    // Clone so the caller could still read the original stream if needed.
    body = await response.clone().json();
  } catch {
    body = undefined;
  }

  const fallback = `Request failed with status ${response.status}`;

  if (isValidationPayload(body)) {
    return new HttpError(body.message || fallback, response.status, body.errors, body);
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : fallback;

  return new HttpError(message, response.status, undefined, body);
}

/**
 * Wraps a transport-level failure (DNS, offline, CORS, abort) — where
 * there is no HTTP status at all — as an {@link HttpError} with
 * `statusCode` undefined.
 *
 * @param cause - The original thrown value from `fetch`.
 */
export function toNetworkError(cause: unknown): HttpError {
  const message = cause instanceof Error ? cause.message : "Network request failed";

  return new HttpError(message, undefined, undefined, cause);
}
