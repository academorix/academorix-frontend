/**
 * @file http-stream.error.ts
 * Streaming operation error.
 *
 * Thrown when a streaming request fails to open, the connector
 * cannot stream, or a parser hits malformed data.
 *
 * @module @stackra/http/errors/http-stream
 */

import { HttpError } from "./http.error";

/**
 * Streaming operation error.
 */
export class HttpStreamError extends HttpError {
  public override readonly name: string = "HttpStreamError";
  public override readonly code: string = "HTTP_STREAM_ERROR";
}
