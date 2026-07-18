/**
 * @file circuit-breaker-state.enum.ts
 * @module @stackra/contracts/enums
 * @description States of the HTTP circuit-breaker state machine.
 */

/** Circuit-breaker states. */
export enum CircuitBreakerState {
  /** Requests flow normally. */
  Closed = "closed",
  /** Requests are short-circuited until the cool-down elapses. */
  Open = "open",
  /** A limited number of probe requests are allowed to test recovery. */
  HalfOpen = "half-open",
}
