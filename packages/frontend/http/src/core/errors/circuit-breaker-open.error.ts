/**
 * Circuit-breaker open error.
 *
 * Raised by `CircuitBreakerMiddleware` when an endpoint's breaker is
 * `Open` and rejects the request fast.
 *
 * @module @stackra/http/errors/circuit-breaker-open
 */

import { HttpError } from './http.error';

/**
 * Thrown when a request is rejected because the circuit breaker is
 * `Open`. Carries a 503 Service Unavailable status code so the rest
 * of the pipeline can normalise it consistently.
 */
export class CircuitBreakerOpenError extends HttpError {
  public override readonly name: string = 'CircuitBreakerOpenError';
  public override readonly code: string = 'HTTP_CIRCUIT_BREAKER_OPEN';

  /** HTTP-equivalent status. */
  public readonly statusCode: number = 503;
}
