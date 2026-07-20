/**
 * Built-in defaults for HTTP middleware/interceptor configuration.
 *
 * Centralised so manager, middleware, and tests use the same numbers.
 *
 * @module @stackra/http/constants/defaults
 */

import type { IHttpCircuitBreakerConfig, IHttpRateLimitEndpointConfig } from "@stackra/contracts";

/**
 * Default rate-limit settings.
 */
export const DEFAULT_RATE_LIMIT: IHttpRateLimitEndpointConfig = {
  requestsPerWindow: 60,
  windowMs: 60_000,
  refillRate: 1.0,
};

/**
 * Default circuit-breaker settings.
 */
export const DEFAULT_CIRCUIT_BREAKER: IHttpCircuitBreakerConfig = {
  enabled: false,
  failureThreshold: 5,
  timeout: 30_000,
  halfOpenRequests: 3,
  successThreshold: 2,
};

/**
 * Default retry attempt count.
 */
export const DEFAULT_MAX_RETRIES = 3;

/**
 * Default exponential backoff (ms) per attempt.
 */
export const DEFAULT_RETRY_BACKOFF: number[] = [1_000, 2_000, 4_000];

/**
 * Default per-request timeout in milliseconds.
 */
export const DEFAULT_TIMEOUT_MS = 30_000;
