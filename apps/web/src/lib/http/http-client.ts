/**
 * @file http-client.ts
 * @module lib/http/http-client
 *
 * @description
 * A small, dependency-free `fetch` wrapper that centralises every concern the
 * REST data + auth providers share:
 *
 * - **Base URL** resolution from a configured origin.
 * - **Bearer token** injection from the shared {@link TokenStore}.
 * - **JSON** request/response handling (with `FormData` pass-through for
 *   uploads).
 * - **Error normalisation** to {@link ApiError} (Refine's `HttpError`).
 * - **401 handling** — clears the token so a stale credential is never reused,
 *   then delegates redirect/logout to the caller via `onUnauthorized`.
 *
 * It deliberately does *not* know about Refine. The data/auth providers build
 * on top of it, which keeps this layer unit-testable in isolation.
 */

import type { TokenStore } from "@/lib/http/token-store";

import { toApiError, toNetworkError } from "@/lib/http/errors";

/** HTTP verbs supported by {@link HttpClient.request}. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** Per-request options. */
export interface RequestOptions {
  method?: HttpMethod;
  /** Pre-built query string (the Laravel query builder produces this). */
  searchParams?: URLSearchParams;
  /**
   * Request body. Plain objects are JSON-serialised; `FormData` is sent as-is
   * (so the browser sets the multipart boundary) for file uploads.
   */
  body?: unknown;
  /** Extra headers merged over the defaults. */
  headers?: Record<string, string>;
  /** Abort signal for cancellation (Refine passes one from React Query). */
  signal?: AbortSignal;
}

/** Construction config for {@link HttpClient}. */
export interface HttpClientConfig {
  /** API origin, e.g. `https://api.academorix.com`. */
  baseUrl: string;
  /** Shared token store used to read the bearer token. */
  tokens: TokenStore;
  /**
   * Invoked once when a request returns `401 Unauthorized`, after the token is
   * cleared. Wire this to your router/auth flow to redirect to `/login`.
   */
  onUnauthorized?: () => void;
}

/**
 * Thin, typed wrapper around `fetch`. Create one instance per API origin and
 * share it across providers.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokens: TokenStore;
  private readonly onUnauthorized?: () => void;

  constructor(config: HttpClientConfig) {
    // Normalise to no trailing slash; `buildUrl` handles joining.
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.tokens = config.tokens;
    this.onUnauthorized = config.onUnauthorized;
  }

  /** The configured API origin (Refine's `dataProvider.getApiUrl`). */
  getApiUrl(): string {
    return this.baseUrl;
  }

  /**
   * Performs a request and returns the parsed JSON body typed as `T`.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path - Absolute path beginning with `/`, e.g. `/api/v1/students`.
   * @throws {ApiError} on non-2xx responses or transport failures.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", searchParams, body, headers, signal } = options;

    const requestInit: RequestInit = {
      method,
      headers: this.buildHeaders(body, headers),
      signal,
    };

    if (body !== undefined && method !== "GET" && method !== "HEAD") {
      requestInit.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    let response: Response;

    try {
      response = await fetch(this.buildUrl(path, searchParams), requestInit);
    } catch (cause) {
      // Network/transport failure — no HTTP status available.
      throw toNetworkError(cause);
    }

    if (response.status === 401) {
      // Drop the stale credential before anyone can retry with it.
      this.tokens.clearToken();
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      throw await toApiError(response);
    }

    return this.parseBody<T>(response);
  }

  /** Convenience wrapper for `GET`. */
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  /** Convenience wrapper for `POST`. */
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  /** Convenience wrapper for `PUT`. */
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  /** Convenience wrapper for `PATCH`. */
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  /** Convenience wrapper for `DELETE`. */
  delete<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  /** Joins the base URL with an absolute path and applies query params. */
  private buildUrl(path: string, searchParams?: URLSearchParams): string {
    const url = new URL(path, `${this.baseUrl}/`);

    if (searchParams && [...searchParams.keys()].length > 0) {
      url.search = searchParams.toString();
    }

    return url.toString();
  }

  /** Builds the default header set, injecting the bearer token when present. */
  private buildHeaders(body: unknown, extra?: Record<string, string>): Headers {
    const headers = new Headers({
      Accept: "application/json",
      // Signals Laravel to return JSON (and 419/422 instead of redirects).
      "X-Requested-With": "XMLHttpRequest",
    });

    // Let the browser set multipart boundaries for FormData uploads.
    if (body !== undefined && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.tokens.getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        headers.set(key, value);
      }
    }

    return headers;
  }

  /** Parses a successful response body, tolerating `204 No Content`. */
  private async parseBody<T>(response: Response): Promise<T> {
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      // Non-JSON success (rare) — return raw text cast to T.
      return (await response.text()) as T;
    }

    return (await response.json()) as T;
  }
}
