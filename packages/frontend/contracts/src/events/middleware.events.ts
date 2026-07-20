/**
 * @file middleware.events.ts
 * @module @stackra/contracts/events
 * @description Event name constants emitted by the `@stackra/ssr/middleware` runtime.
 *
 *   These events are emitted on the `EVENT_EMITTER` bus (registered as
 *   `@Optional` — fail-soft when the events package is not configured).
 *   The constants live in contracts so that dashboards, audit logs, and
 *   metrics collectors can subscribe without depending on `@stackra/ssr`.
 *
 *   @example
 *   ```typescript
 *   import { MIDDLEWARE_EVENTS } from '@stackra/contracts';
 *
 *   @OnEvent(MIDDLEWARE_EVENTS.EXECUTION_FAILED)
 *   onFailure(payload: { name: string; stage: string; error: Error }) {
 *     telemetry.record('middleware.error', payload);
 *   }
 *   ```
 */

/**
 * Middleware lifecycle event names.
 *
 * Payload shapes:
 * - `RESOLVED`            — `{ chain: ResolvedMiddleware[]; input: RouteResolutionInput; durationMs: number }`
 * - `EXECUTION_STARTED`   — `{ name: string; stage: MiddlewareStage; env: 'client' | 'server' }`
 * - `EXECUTION_COMPLETED` — `{ name: string; stage: MiddlewareStage; durationMs: number }`
 * - `EXECUTION_FAILED`    — `{ name: string; stage: MiddlewareStage; error: Error }`
 * - `SHORT_CIRCUITED`     — `{ name: string; signal: 'redirect' | 'not-found' | 'abort'; meta: unknown }`
 */
export const MIDDLEWARE_EVENTS = {
  /** The resolver produced a chain for the current input. */
  RESOLVED: "middleware.resolved",
  /** A single middleware began executing. */
  EXECUTION_STARTED: "middleware.execution.started",
  /** A single middleware finished executing (`next()` returned). */
  EXECUTION_COMPLETED: "middleware.execution.completed",
  /** A middleware threw an error (non-signal exception). */
  EXECUTION_FAILED: "middleware.execution.failed",
  /** A middleware short-circuited via a control-flow signal (redirect/notFound/abort). */
  SHORT_CIRCUITED: "middleware.short-circuited",
} as const;

/**
 * Union type of every emitted middleware event name. Use it to constrain
 * listener registrations or event payload maps.
 */
export type MiddlewareEventName = (typeof MIDDLEWARE_EVENTS)[keyof typeof MIDDLEWARE_EVENTS];
