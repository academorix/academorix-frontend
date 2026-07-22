/**
 * @file rate-limit-exceeded.error.ts
 * Rate-limit exceeded error.
 *
 * Rare in practice — `RateLimitMiddleware` waits for tokens rather
 * than throwing — but exposed for edge cases where a configured
 * timeout is hit before tokens are available.
 *
 * @module @stackra/http/errors/rate-limit-exceeded
 */

import { HttpError } from "./http.error";

/**
 * Thrown when a request exceeds the configured rate limit and cannot
 * wait for a token. Carries 429 Too Many Requests semantics.
 */
export class RateLimitExceededError extends HttpError {
  public override readonly name: string = "RateLimitExceededError";
  public override readonly code: string = "HTTP_RATE_LIMIT_EXCEEDED";

  /** HTTP-equivalent status. */
  public readonly statusCode: number = 429;

  /** Suggested retry-after in milliseconds. */
  public readonly retryAfter: number;

  /**
   * @param message    - Human-readable message.
   * @param retryAfter - Suggested retry-after in milliseconds.
   */
  public constructor(message: string, retryAfter: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}
