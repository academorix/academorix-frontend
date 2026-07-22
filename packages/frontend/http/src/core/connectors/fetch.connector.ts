/**
 * @file fetch.connector.ts
 * Fetch connector.
 *
 * Web-`fetch`-backed driver. Works in modern browsers, Node ≥ 18,
 * Workers, and edge runtimes. Streams via `response.body` (a
 * `ReadableStream<Uint8Array>`) — no extra adapter needed.
 *
 * Opt in via the package's `/fetch` subpath:
 *
 * ```typescript
 * import { FetchConnector } from '@stackra/http/fetch';
 *
 * @Module({
 *   imports: [
 *     HttpModule.forRoot(httpConfig),
 *     HttpModule.forFeature({ driver: 'fetch', connector: FetchConnector }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @module @stackra/http/connectors/fetch-connector
 */

import { Injectable } from "@stackra/container";
import { Str } from "@stackra/support";

import type { IHttpConnector, IHttpContext, IHttpResponse } from "@stackra/contracts";

import { HttpDriverError } from "../errors";

/**
 * Resolve the global `fetch`. Throws when the runtime doesn't ship
 * one and `node-fetch` isn't installed.
 */
function getFetch(): typeof fetch {
  const g = globalThis as { fetch?: typeof fetch };
  if (typeof g.fetch !== "function") {
    throw new HttpDriverError(
      "[FetchConnector] global 'fetch' is unavailable. Run on Node ≥ 18 or polyfill before use.",
    );
  }
  return g.fetch;
}

/**
 * Fetch-backed `IHttpConnector`.
 */
@Injectable()
export class FetchConnector implements IHttpConnector {
  /** @inheritdoc */
  public async send(context: IHttpContext): Promise<IHttpResponse> {
    const url = FetchConnector.buildUrl(context);
    const init = FetchConnector.buildInit(context, false);

    const fetcher = getFetch();
    const response = await fetcher(url, init);
    const data = await FetchConnector.decodeBody(response, context.request.responseType);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: FetchConnector.headersToObject(response.headers),
      config: context.request,
    };
  }

  /** @inheritdoc */
  public async stream(context: IHttpContext): Promise<AsyncIterable<Uint8Array>> {
    const url = FetchConnector.buildUrl(context);
    const init = FetchConnector.buildInit(context, true);

    const fetcher = getFetch();
    const response = await fetcher(url, init);

    if (!response.ok && response.status >= 400) {
      throw new HttpDriverError(
        `[FetchConnector] streaming request failed with HTTP ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new HttpDriverError(
        "[FetchConnector] response.body is missing — runtime does not expose a ReadableStream.",
      );
    }

    return FetchConnector.streamFromBody(response.body);
  }

  /**
   * Wrap a fetch response body into an async-iterable of byte chunks.
   *
   * @param body - `ReadableStream<Uint8Array>` from `fetch`.
   */
  private static async *streamFromBody(
    body: ReadableStream<Uint8Array>,
  ): AsyncIterable<Uint8Array> {
    const reader = body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Build the absolute URL by combining `baseURL`, `url`, and
   * `params`.
   */
  private static buildUrl(context: IHttpContext): string {
    const { request } = context;
    const path = request.url ?? "";
    const base = request.baseURL ?? "";

    let url: string;
    if (Str.startsWith(path, "http://") || Str.startsWith(path, "https://")) {
      url = path;
    } else {
      url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    }

    if (request.params && Object.keys(request.params).length > 0) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(request.params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) search.append(key, String(item));
        } else {
          search.append(key, String(value));
        }
      }
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}${search.toString()}`;
    }

    return url;
  }

  /**
   * Build the `RequestInit` for a fetch call.
   *
   * @param context - Live HTTP context.
   * @param stream  - `true` when the caller wants a streaming
   *   response (skips Content-Type defaulting on JSON parsing).
   */
  private static buildInit(context: IHttpContext, stream: boolean): RequestInit {
    const { request } = context;

    const headers = new Headers(request.headers);
    const body = FetchConnector.encodeBody(request.data, headers);

    const init: RequestInit = {
      method: Str.upper(request.method ?? "GET"),
      headers,
      signal: FetchConnector.combineTimeoutSignal(request.signal, request.timeout),
    };

    if (body !== undefined) {
      init.body = body;
    }

    // Fetch doesn't expose JSON-decoding; we'll do it ourselves in
    // `decodeBody`. This flag exists so future signature changes
    // (HTTP/2 push, etc.) can branch on it cleanly.
    void stream;
    return init;
  }

  /**
   * Encode the request body.
   *
   * - `FormData` / `Blob` / `URLSearchParams` / `ArrayBuffer` /
   *   `string` pass through unchanged.
   * - Plain objects are JSON-encoded with `Content-Type:
   *   application/json` set on the headers (when missing).
   */
  private static encodeBody(data: unknown, headers: Headers): BodyInit | undefined {
    if (data === undefined || data === null) return undefined;

    if (
      data instanceof FormData ||
      data instanceof URLSearchParams ||
      data instanceof Blob ||
      data instanceof ArrayBuffer ||
      typeof data === "string" ||
      ArrayBuffer.isView(data)
    ) {
      return data as BodyInit;
    }

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return JSON.stringify(data);
  }

  /**
   * Decode the response body according to the requested response type.
   */
  private static async decodeBody(response: Response, responseType?: string): Promise<unknown> {
    switch (responseType) {
      case "text":
        return response.text();
      case "blob":
        return response.blob();
      case "arraybuffer":
        return response.arrayBuffer();
      case "stream":
        return response.body;
      case "json":
      case undefined: {
        const text = await response.text();
        if (text.length === 0) return null;
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
      default:
        return response.text();
    }
  }

  /**
   * Combine an external AbortSignal with a timeout signal so the
   * fetch is cancelled by either source.
   */
  private static combineTimeoutSignal(
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
  ): AbortSignal | undefined {
    if (!timeoutMs && !signal) return undefined;
    if (!timeoutMs) return signal;

    const controller = new AbortController();
    const onAbort = (): void => controller.abort();

    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  }

  /**
   * Convert a fetch `Headers` collection to a plain lower-case map.
   */
  private static headersToObject(headers: Headers): Record<string, string> {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[Str.lower(key)] = value;
    });
    return out;
  }
}
