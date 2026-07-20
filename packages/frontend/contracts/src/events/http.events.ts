/**
 * @file http.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/http` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (dashboards,
 *   metrics collectors, tracing) can subscribe without depending on the
 *   HTTP package directly.
 */

/**
 * HTTP lifecycle event names.
 *
 * Common payload shapes: `{ connection, driver?, baseURL? }` for
 * connection events, `{ connection, method, url, status?, durationMs?,
 * error? }` for request/stream events, `{ connection }` for circuit
 * events.
 */
export const HTTP_EVENTS = {
  /** A connection's `HttpClient` was created. */
  CONNECTION_CREATED: "http.connection.created",
  /** A cached connection was forgotten/disposed. */
  CONNECTION_DISPOSED: "http.connection.disposed",
  /** A unary request started. */
  REQUEST_START: "http.request.start",
  /** A unary request completed successfully. */
  REQUEST_SUCCESS: "http.request.success",
  /** A unary request failed. */
  REQUEST_FAILED: "http.request.failed",
  /** A failed request is being retried. */
  REQUEST_RETRY: "http.request.retry",
  /** A streaming request opened. */
  STREAM_OPEN: "http.stream.open",
  /** A streaming request closed normally. */
  STREAM_CLOSE: "http.stream.close",
  /** A streaming request errored. */
  STREAM_ERROR: "http.stream.error",
  /** A circuit-breaker tripped open. */
  CIRCUIT_OPENED: "http.circuit.opened",
  /** A circuit-breaker moved to half-open to probe recovery. */
  CIRCUIT_HALF_OPENED: "http.circuit.half-opened",
  /** A circuit-breaker closed after recovery. */
  CIRCUIT_CLOSED: "http.circuit.closed",
} as const;

/**
 * Union type of every emitted HTTP event name.
 */
export type HttpEventName = (typeof HTTP_EVENTS)[keyof typeof HTTP_EVENTS];
