/**
 * @file http-stream-format.enum.ts
 * @module @stackra/contracts/enums
 * @description Streaming wire formats understood by the HTTP client's
 *   parser factory.
 */

/** Streaming response formats. */
export enum HttpStreamFormat {
  /** Server-Sent Events (`text/event-stream`). */
  Sse = "sse",
  /** Newline-delimited JSON. */
  Ndjson = "ndjson",
  /** Concatenated JSON values. */
  Json = "json",
  /** Raw decoded text chunks. */
  Text = "text",
  /** Raw binary (`Uint8Array`) chunks. */
  Binary = "binary",
}
