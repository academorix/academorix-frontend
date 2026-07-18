/**
 * @file http-resilience.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Circuit-breaker and rate-limit configuration + stats.
 */

import type { CircuitBreakerState } from "@/enums/circuit-breaker-state.enum";

/**
 * Circuit-breaker configuration for a connection.
 */
export interface IHttpCircuitBreakerConfig {
  /** Whether the breaker is active. */
  enabled: boolean;
  /** Consecutive failures before the breaker trips open. */
  failureThreshold: number;
  /** Cool-down (ms) before a half-open probe is allowed. */
  timeout: number;
  /** Number of probe requests permitted while half-open. */
  halfOpenRequests: number;
  /** Consecutive half-open successes required to close again. */
  successThreshold: number;
}

/**
 * Live circuit-breaker statistics.
 */
export interface IHttpCircuitBreakerStats {
  /** Current state. */
  state: CircuitBreakerState;
  /** Consecutive failures recorded. */
  failureCount: number;
  /** Consecutive successes recorded. */
  successCount: number;
  /** Probe attempts made while half-open. */
  halfOpenAttempts: number;
  /** Timestamp (ms) the breaker last opened, or `null`. */
  openedAt: number | null;
  /** Convenience flag — `state === Open`. */
  isOpen: boolean;
  /** Convenience flag — `state === HalfOpen`. */
  isHalfOpen: boolean;
  /** Convenience flag — `state === Closed`. */
  isClosed: boolean;
}

/**
 * Token-bucket rate-limit configuration for one endpoint (or the default).
 */
export interface IHttpRateLimitEndpointConfig {
  /** Bucket capacity — max requests per window. */
  requestsPerWindow: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Token refill rate, tokens per second. */
  refillRate: number;
}
