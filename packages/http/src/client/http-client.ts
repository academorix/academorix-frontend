/**
 * @file http-client.ts
 * @module @academorix/http/client/http-client
 *
 * @description
 * A dependency-free `fetch` wrapper that centralises every concern the
 * REST data + auth providers share (see the workspace HTTP §):
 *
 *  - **Base URL** — set at construction, joined with the request path.
 *  - **Bearer token** — injected from the shared {@link TokenStore}.
 *  - **Device + client fingerprint headers** — every request carries
 *    `X-Device-*`, `X-Client`, `X-Timezone`, `X-Locale`,
 *    `X-Api-Version` when a `deviceHeaders` reader is configured.
 *  - **JSON** — request/response handling with `FormData` pass-through
 *    for uploads.
 *  - **Error normalisation** — every failure resolves to an
 *    {@link HttpError} (from `@academorix/core/errors`) whose shape
 *    matches Refine's `HttpError` interface.
 *  - **Single-flight refresh on 401** — one refresh attempt, then
 *    retry the original request once. If the refresh fails, the
 *    caller's original error propagates so `authProvider.onError`
 *    redirects to `/login`.
 *
 * Deliberately Refine-agnostic — data/auth providers build on top of
 * it, which keeps the layer unit-testable in isolation.
 */

import { toHttpError, toNetworkError } from "../errors/normalize.util";

import type { RefreshCoordinator } from "../refresh/refresh-coordinator";
import type { TokenStore } from "../tokens/token-store";

/** HTTP verbs supported by {@link HttpClient.request}. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** Per-request options. */
export interface RequestOptions {
  method?: HttpMethod;
  /** Pre-built query string (e.g. the Laravel query builder produces this). */
  searchParams?: URLSearchParams;
  /**
   * Request body. Plain objects are JSON-serialised; `FormData` is
   * sent as-is (so the browser sets the multipart boundary) for file
   * uploads.
   */
  body?: unknown;
  /** Extra headers merged over the defaults. */
  headers?: Record<string, string>;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
  /**
   * When `false`, disables the single-flight refresh + retry loop for
   * this request. Used by the auth provider's own refresh call to
   * avoid recursion.
   */
  allowRefresh?: boolean;
}

/** Construction config for {@link HttpClient}. */
export interface HttpClientConfig {
  /**
   * API origin **including** the API path prefix, e.g.
   * `https://riverside.academorix.app/api`.
   */
  readonly baseUrl: string;
  /** Shared token store used to read the bearer token. */
  readonly tokens: TokenStore;
  /**
   * Invoked once when a request returns `401 Unauthorized` and the
   * refresh flow could not recover. Wire this to your router/auth
   * flow to redirect to `/login`.
   */
  readonly onUnauthorized?: () => void;
  /**
   * API version echoed on every request in the `X-Api-Version`
   * header. Read by the backend's `api.version` middleware. Defaults
   * to `"1.0"`.
   */
  readonly apiVersion?: string;
  /**
   * Optional device-header reader from
   * {@link "@academorix/http/device"}. When set, every request
   * includes the `X-Device-*` / `X-Client` / `X-Timezone` / `X-Locale`
   * headers.
   */
  readonly deviceHeaders?: () => Record<string, string>;
}

/**
 * Thin, typed wrapper around `fetch`. Create one instance per API
 * origin and share it across providers.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokens: TokenStore;
  private readonly onUnauthorized?: () => void;
  private readonly apiVersion: string;
  private readonly deviceHeaders: (() => Record<string, string>) | undefined;
  private refreshCoordinator: RefreshCoordinator | null = null;

  constructor(config: HttpClientConfig) {
    // Normalise to no trailing slash; `buildUrl` handles joining.
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.tokens = config.tokens;
    this.onUnauthorized = config.onUnauthorized;
    this.apiVersion = config.apiVersion ?? "1.0";
    this.deviceHeaders = config.deviceHeaders;
  }

  /**
   * Attaches a refresh coordinator (typically bound to the same
   * client + token store). Optional — without one, a 401 immediately
   * clears the token.
   */
  attachRefreshCoordinator(coordinator: RefreshCoordinator): void {
    this.refreshCoordinator = coordinator;
  }

  /** The configured API origin (Refine's `dataProvider.getApiUrl`). */
  getApiUrl(): string {
    return this.baseUrl;
  }

  /**
   * Performs a request and returns the parsed JSON body typed as `T`.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path - Absolute path beginning with `/`, e.g. `/v1/tenants`.
   * @throws {HttpError} on non-2xx responses or transport failures.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.executeWithRefresh<T>(path, options, /* isRetry */ false);
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

  /**
   * The core request loop with a single-flight refresh + retry on 401.
   * Split out from `request` so a retry does not re-recurse
   * infinitely: `isRetry` short-circuits the second attempt to a hard
   * failure.
   */
  private async executeWithRefresh<T>(
    path: string,
    options: RequestOptions,
    isRetry: boolean,
  ): Promise<T> {
    const { method = "GET", searchParams, body, headers, signal, allowRefresh = true } = options;

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
      // Try to refresh once, then retry the original request. If
      // refresh is disabled (auth provider paths) or already used its
      // single retry, fall through to the hard-failure path below.
      const canRefresh =
        !isRetry && allowRefresh && this.refreshCoordinator !== null && this.tokens.hasValidToken();

      if (canRefresh && this.refreshCoordinator) {
        const refreshed = await this.refreshCoordinator.refresh();

        if (refreshed) {
          return this.executeWithRefresh<T>(path, options, /* isRetry */ true);
        }
      }

      // Drop the stale credential before anyone can retry with it.
      this.tokens.clearToken();
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      throw await toHttpError(response);
    }

    return this.parseBody<T>(response);
  }

  /** Joins the base URL with an absolute path and applies query params. */
  private buildUrl(path: string, searchParams?: URLSearchParams): string {
    const normalisedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalisedPath}`);

    if (searchParams) {
      const serialized = searchParams.toString();

      if (serialized.length > 0) {
        url.search = serialized;
      }
    }

    return url.toString();
  }

  /**
   * Builds the default header set: JSON accept, XHR hint, API
   * version, device fingerprint, bearer token when present, plus any
   * per-request overrides.
   */
  private buildHeaders(body: unknown, extra?: Record<string, string>): Headers {
    const headers = new Headers({
      Accept: "application/json",
      // Signals Laravel to return JSON (and 419/422 instead of redirects).
      "X-Requested-With": "XMLHttpRequest",
      "X-Api-Version": this.apiVersion,
    });

    if (this.deviceHeaders) {
      for (const [key, value] of Object.entries(this.deviceHeaders())) {
        headers.set(key, value);
      }
    }

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

/**
 * Convenience factory: constructs an {@link HttpClient} + attaches a
 * refresh coordinator in one call. Apps use this to wire the singleton
 * in their `index.ts` / `providers.tsx` without ceremony.
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
