/**
 * @file axios.connector.ts
 * Axios connector.
 *
 * Default driver. Wraps `axios.request()` for unary requests and
 * `axios.request({ responseType: 'stream' })` for streaming.
 * Browsers don't support axios streaming reliably — apps targeting
 * the browser should opt into `FetchConnector` (subpath `/fetch`).
 *
 * @module @stackra/http/connectors/axios-connector
 */

import { Injectable } from "@stackra/container";
import { Str } from "@stackra/support";

import type { IHttpConnector, IHttpContext, IHttpResponse } from "@stackra/contracts";

import { HttpDriverError } from "../errors";

/**
 * Lazily-loaded `axios` module reference.
 *
 * Kept as a module-level variable so the dynamic `import()` runs at
 * most once per process even when many connections are created.
 */
let axiosModule: typeof import("axios") | null = null;

/**
 * Resolve the axios module on first use. Throws a friendly error
 * when `axios` is not installed so consumers see the missing peer
 * dependency immediately.
 */
async function loadAxios(): Promise<typeof import("axios")> {
  if (axiosModule) return axiosModule;
  try {
    axiosModule = await import("axios");
    return axiosModule;
  } catch (err: Error | any) {
    throw new HttpDriverError(
      "[AxiosConnector] 'axios' is not installed. Install it or switch to FetchConnector via @stackra/http/fetch.",
      err as Error,
    );
  }
}

/**
 * Axios-backed `IHttpConnector` implementation.
 */
@Injectable()
export class AxiosConnector implements IHttpConnector {
  /** @inheritdoc */
  public async send(context: IHttpContext): Promise<IHttpResponse> {
    const axios = await loadAxios();
    const { request } = context;

    const response = await axios.default.request({
      url: request.url,
      method: Str.lower(request.method ?? "get"),
      baseURL: request.baseURL,
      headers: request.headers,
      params: request.params,
      data: request.data,
      timeout: request.timeout,
      signal: request.signal,
      responseType: (request.responseType ?? "json") as never,
      onUploadProgress: request.onUploadProgress as never,
      onDownloadProgress: request.onDownloadProgress as never,
    });

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: request,
    };
  }

  /**
   * Streaming via axios. On Node, axios returns a Node Readable in
   * `responseType: 'stream'` mode. We wrap it as an AsyncIterable
   * so the client/parser layer doesn't have to know about Node
   * streams. In the browser this isn't reliable — consumers should
   * use `FetchConnector` for streaming.
   *
   * @inheritdoc
   */
  public async stream(context: IHttpContext): Promise<AsyncIterable<Uint8Array>> {
    const axios = await loadAxios();
    const { request } = context;

    const response = await axios.default.request({
      url: request.url,
      method: Str.lower(request.method ?? "get"),
      baseURL: request.baseURL,
      headers: request.headers,
      params: request.params,
      data: request.data,
      timeout: request.timeout,
      signal: request.signal,
      responseType: "stream",
    });

    const data = response.data as unknown;
    return AxiosConnector.toAsyncIterable(data);
  }

  /**
   * Adapt the axios stream payload to an `AsyncIterable<Uint8Array>`.
   * Supports:
   *
   * - Web `ReadableStream` (modern browsers / undici under axios).
   * - Node `Readable` streams (Node axios `responseType: 'stream'`).
   *
   * @param data - Axios response body.
   */
  private static async *toAsyncIterable(data: unknown): AsyncIterable<Uint8Array> {
    // Web stream support — runtime agnostic.
    if (data && typeof (data as ReadableStream<Uint8Array>).getReader === "function") {
      const reader = (data as ReadableStream<Uint8Array>).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) yield value;
        }
      } finally {
        reader.releaseLock();
      }
      return;
    }

    // Node Readable — supports `for-await-of` natively.
    if (data && typeof (data as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function") {
      for await (const chunk of data as AsyncIterable<unknown>) {
        if (chunk instanceof Uint8Array) {
          yield chunk;
        } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(chunk)) {
          yield new Uint8Array(chunk);
        } else if (typeof chunk === "string") {
          yield new TextEncoder().encode(chunk);
        }
      }
      return;
    }

    throw new HttpDriverError(
      "[AxiosConnector] axios returned an unsupported stream payload — use FetchConnector for streaming in the browser.",
    );
  }
}
