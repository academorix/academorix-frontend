/**
 * @file http-client.ts
 * @module lib/api/http-client
 *
 * @description
 * Thin fetch wrapper used by every API-adjacent module (auth today, resource
 * data providers next). Owns:
 *
 *   1. **Base URL resolution** — reads `VITE_API_URL` at build time so the
 *      dashboard can hit the tenant subdomain's API without hard-coding
 *      host strings across the codebase.
 *   2. **Bearer token attachment** — every non-public request carries
 *      `Authorization: Bearer {token}` from {@link readAccessToken}.
 *   3. **JSON headers + body serialisation** — the app is JSON-only, so
 *      `Content-Type: application/json` and `Accept: application/json` are
 *      always set on requests with a body.
 *   4. **Error normalisation** — every non-2xx response turns into an
 *      {@link ApiError} with the parsed JSON body attached, so consumers
 *      can render field-level validation errors + status-driven UI without
 *      re-parsing the response.
 *
 * ## Why not axios / ky / etc
 *
 * The whole surface is < 200 LOC of typed fetch — pulling in a client
 * library would double the bundle for what amounts to two well-defined
 * wrappers around `fetch()`.
 */

import { clearAuthToken, readAccessToken } from "@/lib/auth/token-store";

/**
 * Base URL for every HTTP call. Reads the Vite env var at build time so
 * the dashboard can target `http://localhost:8000` in dev and swap for
 * the tenant subdomain in production without a code change.
 */
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://localhost:8000";

/**
 * Parameters accepted by every wrapper. Kept as a superset of Fetch's
 * `RequestInit` so escape hatches (custom headers, credentials, signal)
 * work without a special case.
 */
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /**
   * Skip the `Authorization` header on this request. Used by the login
   * / signup / find-workspaces endpoints where the caller doesn't yet
   * hold a token.
   */
  anonymous?: boolean;
  /**
   * Extra query-string parameters merged into the URL. Values are
   * URL-encoded; `undefined` / `null` entries are stripped so a caller
   * can pass a partial filter map without dropping empty fields at the
   * call site.
   */
  query?: Record<string, string | number | boolean | null | undefined>;
  /**
   * Request body — serialised with `JSON.stringify`. Pass `null` /
   * `undefined` for verbs that don't take a body (`GET`, `DELETE`).
   */
  json?: unknown;
}

/**
 * The error thrown for any non-2xx response. Carries the HTTP status,
 * a machine-parseable code (`errors.<key>` from the backend's error
 * envelope when present, falls back to a status-derived slug), a
 * human-readable message, and the raw parsed body so consumers can
 * reach for field-level `errors` on validation failures.
 */
export class ApiError extends Error {
  /**
   * @param status - HTTP status code (e.g. 401, 422, 500).
   * @param code - Machine-readable slug for switch-based handling.
   * @param message - Human-readable message safe to show in a toast.
   * @param body - Parsed JSON body (or `null` when the response wasn't
   *   JSON). Callers reach into `body.errors` for field-level messages.
   */
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Convenience — flattens Laravel's `errors: {field: [msg,...]}` into
   * a `Record<string, string>` for form-field mapping. Returns an
   * empty object when the shape doesn't match so callers can spread
   * unconditionally.
   */
  fieldErrors(): Record<string, string> {
    const body = this.body as { errors?: Record<string, string[] | string> } | null;

    if (!body?.errors) return {};

    const result: Record<string, string> = {};

    for (const [field, messages] of Object.entries(body.errors)) {
      result[field] = Array.isArray(messages) ? (messages[0] ?? "") : String(messages);
    }

    return result;
  }
}

/**
 * Merge a base URL, a path, and an optional query-string map into a
 * fully-qualified URL string. Kept as a helper so tests can assert
 * the composition without patching `fetch`.
 */
function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  // Preserve absolute URLs verbatim — the WebAuthn library returns
  // callback URLs that already include the host and shouldn't be
  // re-prefixed with our base.
  const url = /^https?:\/\//i.test(path)
    ? new URL(path)
    : new URL(path.startsWith("/") ? path : `/${path}`, `${API_BASE_URL}/`);

  if (query) {
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;

      url.searchParams.set(key, String(raw));
    }
  }

  return url.toString();
}

/**
 * Read the response body as JSON, tolerating empty (`204 No Content`)
 * responses. Returns `null` for empties so callers can typecheck
 * against a defined value.
 */
async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = response.headers.get("content-length");

  // Fast path — 204 or explicit zero-length body.
  if (response.status === 204 || contentLength === "0") return null;

  if (!contentType.includes("application/json")) {
    // Unknown content type — read as text so the error path still has
    // *something* to surface. Consumers should never see this in
    // practice; the backend always sends JSON.
    const text = await response.text();

    return text ? { message: text } : null;
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Convert a non-2xx response into an {@link ApiError}. Prefers the
 * server's `message` + `code` when present; falls back to a
 * status-derived slug so switch statements can always find a stable
 * key.
 */
function buildApiError(status: number, body: unknown): ApiError {
  const envelope = body as { message?: string; code?: string } | null;
  const message =
    envelope?.message ??
    (status >= 500
      ? "Something went wrong on our side. Please try again."
      : "Your request could not be completed.");

  const code = envelope?.code ?? `http_${status}`;

  return new ApiError(status, code, message, body);
}

/**
 * Send a request through the configured base URL. Returns the parsed
 * JSON envelope (or `null` for 204 responses). Throws {@link ApiError}
 * on any non-2xx status.
 *
 * ## 401 side-effect
 *
 * A 401 response clears the local auth state before re-throwing. That
 * keeps the token store synchronised with the server without
 * requiring every call site to know about auth state, and lets the
 * shell's `<Authenticated>` guard bounce the user to `/sign-in` on
 * the next render.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { anonymous, query, json, headers, method, ...rest } = options;
  const url = buildUrl(path, query);

  const finalHeaders = new Headers(headers);

  finalHeaders.set("Accept", "application/json");

  // Only set Content-Type on requests carrying a body — bare GETs
  // shouldn't advertise a body type they don't have.
  if (json !== undefined && json !== null) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (!anonymous) {
    const token = readAccessToken();

    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...rest,
    body: json !== undefined && json !== null ? JSON.stringify(json) : undefined,
    headers: finalHeaders,
    method: method ?? (json !== undefined && json !== null ? "POST" : "GET"),
  });

  const body = await parseJson(response);

  if (!response.ok) {
    if (response.status === 401 && !anonymous) {
      // Server-side token revocation or expiry — clear the local copy
      // so downstream reads (`useGetIdentity`, `check()`, etc.) return
      // to unauthenticated cleanly. The route guard renders the
      // sign-in redirect on the next React commit.
      clearAuthToken();
    }

    throw buildApiError(response.status, body);
  }

  return body as T;
}

/**
 * Small vocab helpers so call sites read as `authApi.login(...)`
 * rather than `apiRequest('/login', {json, method: 'POST'})`. Kept
 * as one-liners rather than switching to a class to keep tree-shake
 * behaviour simple.
 */
export const http = {
  get: <T>(path: string, options: Omit<ApiRequestOptions, "json"> = {}): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, json: unknown = null, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "POST", json }),
  put: <T>(path: string, json: unknown = null, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "PUT", json }),
  patch: <T>(path: string, json: unknown = null, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "PATCH", json }),
  delete: <T>(path: string, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
