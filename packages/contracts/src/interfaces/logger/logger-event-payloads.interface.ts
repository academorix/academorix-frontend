/**
 * @file logger-event-payloads.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Typed payloads for every constant in `LOGGER_EVENTS`.
 */

import type { LogLevel } from "@/enums/log-level.enum";
import type { LogContext } from "@/types/log-context.type";

/**
 * Payload for `LOGGER_EVENTS.MESSAGE_LOGGED` — an enriched log
 * entry was dispatched to a channel's reporters.
 */
export interface ILoggerMessageLoggedPayload {
  /** Numeric priority (see `LOG_LEVEL_PRIORITY`). */
  readonly level: LogLevel;
  /** Formatted human-readable message. */
  readonly message: string;
  /** Structured log context (`{ requestId, userId, ... }`). */
  readonly context: LogContext;
  /** Channel name that dispatched the entry. */
  readonly channel: string;
  /** UNIX epoch milliseconds when the entry was emitted. */
  readonly timestamp: number;
  /** Optional arbitrary metadata attached by enrichers. */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Payload for `LOGGER_EVENTS.CHANNEL_RESOLVED` — a channel was
 * instantiated for the first time (via `manager.channel(name)`).
 */
export interface ILoggerChannelResolvedPayload {
  /** Channel name. */
  readonly name: string;
  /** Names of reporters bound to the channel. */
  readonly reporters: readonly string[];
  /** Effective minimum log level applied to the channel. */
  readonly level: LogLevel;
}

/**
 * Payload for `LOGGER_EVENTS.REPORTER_REGISTERED` — a reporter was
 * added to the manager via decorator discovery or `manager.registerReporter`.
 */
export interface ILoggerReporterRegisteredPayload {
  /** Reporter name (unique within the manager). */
  readonly name: string;
}

/**
 * Payload for `LOGGER_EVENTS.FORMATTER_REGISTERED` — a formatter
 * was added to the manager.
 */
export interface ILoggerFormatterRegisteredPayload {
  /** Formatter name. */
  readonly name: string;
}

/**
 * Payload for `LOGGER_EVENTS.LEVEL_CHANGED` — a channel's minimum
 * level was changed at runtime.
 */
export interface ILoggerLevelChangedPayload {
  /** Channel whose level changed. */
  readonly channel: string;
  /** New minimum level. */
  readonly level: LogLevel;
}

/**
 * Payload for `LOGGER_EVENTS.FLUSH_COMPLETED` — every registered
 * reporter completed flushing its buffers.
 */
export interface ILoggerFlushCompletedPayload {
  /** Reporter names that were flushed. */
  readonly reporters: readonly string[];
}
