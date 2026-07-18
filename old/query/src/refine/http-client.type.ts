/**
 * @file http-client.type.ts
 * @module @academorix/query/refine/http-client.type
 *
 * @description
 * Structural type describing the subset of `HttpClient` methods the
 * Refine adapter calls. Kept independent of any specific class so
 * consumers can pass in their own transport shim — the workspace's
 * {@link "@academorix/http" HttpClient} satisfies it, and so does the
 * dashboard's older local `HttpClient` variant during the migration
 * window.
 *
 * TypeScript's structural rules block class-to-class assignments when
 * either side has private fields, so exposing the surface as an
 * interface here keeps the adapter portable across the two clients.
 */

/** HTTP verbs the adapter emits. */
export type HttpClientMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** Per-request options accepted by every method. */
export interface HttpClientRequestOptions {
  readonly method?: HttpClientMethod;
  readonly searchParams?: URLSearchParams;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
}

/**
 * Structural mirror of the methods {@link createRefineRestDataProvider}
 * needs. The workspace's `HttpClient` class from `@academorix/http`
 * satisfies this shape directly.
 */
export interface HttpClientLike {
  /** Convenience `GET` wrapper. */
  get: <T>(path: string, options?: Omit<HttpClientRequestOptions, "method" | "body">) => Promise<T>;

  /** Convenience `POST` wrapper. */
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<HttpClientRequestOptions, "method">,
  ) => Promise<T>;

  /** Convenience `PUT` wrapper. */
  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<HttpClientRequestOptions, "method">,
  ) => Promise<T>;

  /**
   * Convenience `DELETE` wrapper. Tolerates a 204 (undefined) body —
   * the adapter propagates that through as the record type's
   * `undefined` value.
   */
  delete: <T>(path: string, options?: Omit<HttpClientRequestOptions, "method">) => Promise<T>;

  /**
   * Full-control request escape hatch. Used by the `custom` method
   * so callers can emit arbitrary verbs against arbitrary URLs.
   */
  request: <T>(path: string, options?: HttpClientRequestOptions) => Promise<T>;

  /** Returns the API origin (Refine's `useApiUrl()` reads this). */
  getApiUrl: () => string;
}
