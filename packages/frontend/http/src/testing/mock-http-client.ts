/**
 * @file mock-http-client.ts
 * @module @stackra/http/testing
 * @description In-memory `IHttpClient` for tests.
 *
 *   Records every request and returns stubbed responses. `get`/`post`/…
 *   resolve the stub registered for `"<METHOD> <url>"` (falling back to
 *   a `200 {}` response), so consumer code exercises the real client
 *   surface without a network.
 */

import type {
  IHttpClient,
  IHttpRequestConfig,
  IHttpResponse,
  IHttpStream,
  ISseConfig,
  ISseEvent,
  IStreamConfig,
} from "@stackra/contracts";

/** A recorded request. */
export interface RecordedRequest {
  method: string;
  url: string;
  data?: unknown;
  config?: IHttpRequestConfig;
  requestedAt: number;
}

/** Partial response used when stubbing. */
export interface ResponseStub<T = unknown> {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: T;
}

/**
 * In-memory HTTP client for testing. Implements the full `IHttpClient`
 * contract.
 */
export class MockHttpClient implements IHttpClient {
  /** Every request issued through this client, in order. */
  public readonly requests: RecordedRequest[] = [];

  /** Stubbed responses keyed by `"<METHOD> <url>"`. */
  private readonly stubs = new Map<string, ResponseStub>();

  /** Queued stream values keyed by `"<METHOD> <url>"`. */
  private readonly streamStubs = new Map<string, unknown[]>();

  public async get<T = unknown>(
    url: string,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.record<T>("GET", url, undefined, config);
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.record<T>("POST", url, data, config);
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.record<T>("PUT", url, data, config);
  }

  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.record<T>("PATCH", url, data, config);
  }

  public async delete<T = unknown>(
    url: string,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.record<T>("DELETE", url, undefined, config);
  }

  public async request<T = unknown>(config: IHttpRequestConfig): Promise<IHttpResponse<T>> {
    return this.record<T>(config.method ?? "GET", config.url ?? "", config.data, config);
  }

  public stream<T = unknown>(url: string, config?: IStreamConfig): IHttpStream<T> {
    const method = config?.method ?? "GET";
    this.requests.push({ method, url, config, requestedAt: Date.now() });
    const values = (this.streamStubs.get(this.key(method, url)) ?? []) as T[];
    return MockHttpClient.toStream<T>(values);
  }

  public sse<T = unknown>(url: string, config?: ISseConfig): IHttpStream<ISseEvent<T>> {
    const method = config?.method ?? "GET";
    this.requests.push({ method, url, config, requestedAt: Date.now() });
    const values = (this.streamStubs.get(this.key(method, url)) ?? []) as ISseEvent<T>[];
    return MockHttpClient.toStream<ISseEvent<T>>(values);
  }

  // ── Test helpers ─────────────────────────────────────────────────────

  /** Stub the response for a `method`+`url` pair. */
  public stubResponse<T = unknown>(method: string, url: string, response: ResponseStub<T>): this {
    this.stubs.set(this.key(method, url), response);
    return this;
  }

  /** Queue the values a `stream()`/`sse()` call for `method`+`url` will yield. */
  public stubStream(method: string, url: string, values: unknown[]): this {
    this.streamStubs.set(this.key(method, url), values);
    return this;
  }

  /** Requests filtered by method. */
  public requestsFor(method: string): RecordedRequest[] {
    return this.requests.filter((r) => r.method === method.toUpperCase());
  }

  /** Drop recorded requests (keeps stubs). */
  public clearRequests(): void {
    this.requests.length = 0;
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private async record<T>(
    method: string,
    url: string,
    data: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    const upper = method.toUpperCase();
    this.requests.push({ method: upper, url, data, config, requestedAt: Date.now() });
    const stub = this.stubs.get(this.key(upper, url));
    return {
      data: (stub?.data ?? {}) as T,
      status: stub?.status ?? 200,
      statusText: stub?.statusText ?? "OK",
      headers: stub?.headers ?? {},
      config,
    };
  }

  private key(method: string, url: string): string {
    return `${method.toUpperCase()} ${url}`;
  }

  private static toStream<T>(values: readonly T[]): IHttpStream<T> {
    let cancelled = false;
    async function* iterate(): AsyncIterator<T> {
      for (const value of values) {
        if (cancelled) return;
        yield value;
      }
    }
    const it = iterate();
    return {
      [Symbol.asyncIterator]: () => it,
      cancel: () => {
        cancelled = true;
      },
    };
  }
}
