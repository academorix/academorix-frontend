/**
 * @file http-stream.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Streaming contracts — async-iterable stream handle, its
 *   config shapes, and the SSE event envelope.
 */

import type { HttpStreamFormat } from "@/enums/http-stream-format.enum";
import type { IHttpRequestConfig } from "./http-request.interface";

/**
 * A cancellable async-iterable stream of decoded values.
 *
 * @typeParam T - Decoded value type.
 */
export interface IHttpStream<T = unknown> extends AsyncIterable<T> {
  /** Iterate decoded values as they arrive. */
  [Symbol.asyncIterator](): AsyncIterator<T>;
  /** Abort the underlying request and settle the iterator. */
  cancel(): void;
}

/**
 * Streaming request config — a request config plus a wire format.
 */
export interface IStreamConfig extends IHttpRequestConfig {
  /** Wire format used to decode chunks (defaults to SSE). */
  format?: HttpStreamFormat;
}

/**
 * Server-Sent Events request config. Same surface as a request config;
 * `Accept: text/event-stream` is applied by the client.
 */
export type ISseConfig = IHttpRequestConfig;

/**
 * A single decoded Server-Sent Event.
 *
 * @typeParam T - Decoded `data` payload type.
 */
export interface ISseEvent<T = unknown> {
  /** Decoded `data:` payload. */
  data: T;
  /** `id:` field, if present. */
  id?: string;
  /** `event:` field, if present. */
  type?: string;
  /** `retry:` field (ms), if present. */
  retry?: number;
}
