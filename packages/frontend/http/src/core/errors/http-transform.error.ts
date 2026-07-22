/**
 * @file http-transform.error.ts
 * Transform operation error.
 *
 * Raised when request/response transformation fails (case conversion,
 * date serialisation, or a custom transform throws). The transform
 * interceptor catches and degrades gracefully.
 *
 * @module @stackra/http/errors/http-transform
 */

import { HttpError } from "./http.error";

/**
 * Transform operation error. Carries the offending data for
 * observability.
 */
export class HttpTransformError extends HttpError {
  public override readonly name: string = "HttpTransformError";
  public override readonly code: string = "HTTP_TRANSFORM_ERROR";

  /** Data that failed to transform. */
  public readonly data: unknown;

  /**
   * @param message - Human-readable message.
   * @param data    - Offending input.
   */
  public constructor(message: string, data: unknown) {
    super(message);
    this.data = data;
  }
}
