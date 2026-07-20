/**
 * @file logger.events.ts
 * @module @stackra/contracts/events
 * @description Event name constants emitted by `@stackra/logger`.
 *
 *   Emitted by `LoggerManager` on the optional event bus (wired via
 *   `setPubSub()` at module init). Useful for shipping logs to
 *   secondary sinks (Slack, Sentry, Loki) without re-registering
 *   reporters.
 *
 *   @example
 *   ```typescript
 *   import { LOGGER_EVENTS } from '@stackra/contracts';
 *
 *   @OnEvent(LOGGER_EVENTS.MESSAGE_LOGGED)
 *   onMessageLogged(payload: { level: string; message: string }) {
 *     if (payload.level === 'error') slack.notify(payload.message);
 *   }
 *   ```
 */

/**
 * Logger lifecycle event names.
 *
 * Payload shapes:
 * - `MESSAGE_LOGGED`       — `{ level, message, context, channel, timestamp, meta }`
 * - `CHANNEL_RESOLVED`     — `{ name, reporters, level }`
 * - `REPORTER_REGISTERED`  — `{ name }`
 * - `FORMATTER_REGISTERED` — `{ name }`
 * - `LEVEL_CHANGED`        — `{ channel, level }`
 * - `FLUSH_COMPLETED`      — `{ reporters }`
 */
export const LOGGER_EVENTS = {
  /** An enriched log entry was dispatched to a channel's reporters. */
  MESSAGE_LOGGED: "logger.message.logged",
  /** A channel was resolved (instantiated) for the first time. */
  CHANNEL_RESOLVED: "logger.channel.resolved",
  /** A reporter was registered with the manager. */
  REPORTER_REGISTERED: "logger.reporter.registered",
  /** A formatter was registered with the manager. */
  FORMATTER_REGISTERED: "logger.formatter.registered",
  /** A channel's minimum level was changed at runtime. */
  LEVEL_CHANGED: "logger.level.changed",
  /** All registered reporters completed flushing. */
  FLUSH_COMPLETED: "logger.flush.completed",
} as const;

/** Union type of every emitted logger event name. */
export type LoggerEventName = (typeof LOGGER_EVENTS)[keyof typeof LOGGER_EVENTS];
