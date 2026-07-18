/**
 * @file http-error.ts
 * @module @academorix/core/errors/http-error
 *
 * @description
 * A framework-agnostic HTTP error class shared by every network-touching
 * package in the workspace (`@academorix/http`, `@academorix/query`,
 * `@academorix/notifications`, and each app's HTTP wrappers).
 *
 * Shape mirrors Refine's `HttpError` so the dashboard's data provider
 * can rethrow instances without translation:
 *
 * ```ts
 * class HttpError {
 *   message: string;
 *   statusCode: number | undefined;
 *   errors: Record<string, string[]> | undefined;
 *   body: unknown;
 * }
 * ```
 *
 * The class also carries the raw response `body` (post-JSON-parse when
 * possible, otherwise the response text) so callers that need to
 * surface field-level errors can walk it without a second fetch.
 *
 * ## Backend contract this maps to
 *
 * Laravel's spatie/laravel-data pipeline emits, on failure:
 *
 * ```json
 * {
 *   "message": "The given data was invalid.",
 *   "errors": {
 *     "email": ["The email has already been taken."],
 *     "password": ["The password field is required."]
 *   }
 * }
 * ```
 *
 * `HttpError.errors` retains that shape verbatim so Refine's form
 * error surfaces (`useForm`, `useTable`) can bind by field key.
 */

/**
 * Rich HTTP error used by every network-touching layer in the workspace.
 *
 * Not thrown directly by transport code — use the {@link toHttpError}
 * factory (in `@academorix/http`) which handles fetch-vs-network vs
 * unknown failure modes.
 */
export class HttpError extends Error {
  /** HTTP status code returned by the server. `undefined` for transport failures. */
  readonly statusCode: number | undefined;

  /**
   * Field-level validation errors from Laravel's spatie/laravel-data
   * pipeline. Shape: `{ [fieldPath]: [msg1, msg2, ...] }`.
   */
  readonly errors: Record<string, string[]> | undefined;

  /**
   * The raw response body (parsed JSON when possible, raw text
   * otherwise). Kept so surfaces that need custom rendering can walk
   * the shape without re-issuing the request.
   */
  readonly body: unknown;

  /**
   * @param message - Human-readable summary. Prefer the server-provided
   *   `message` field; fall back to `${status} ${statusText}`.
   * @param statusCode - HTTP status code, or `undefined` for transport
   *   failures (network unreachable, DNS, CORS preflight).
   * @param errors - Optional field-level errors from Laravel.
   * @param body - The raw response payload for custom rendering.
   */
  constructor(
    message: string,
    statusCode?: number,
    errors?: Record<string, string[]>,
    body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.body = body;
  }

  /**
   * Convenience factory for tests + call sites that already have a
   * response envelope in hand. `body.message` and `body.errors` are
   * lifted onto the error; the raw body is retained on `.body`.
   */
  static fromEnvelope(
    statusCode: number,
    body: { message?: string; errors?: Record<string, string[]> },
  ): HttpError {
    return new HttpError(
      body.message ?? `Request failed with status ${statusCode}.`,
      statusCode,
      body.errors,
      body,
    );
  }
}

/** Type predicate — narrows an unknown value to {@link HttpError}. */
export function isHttpError(value: unknown): value is HttpError {
  return value instanceof HttpError;
}
