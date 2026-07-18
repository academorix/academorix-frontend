/**
 * @file log-entry.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description A single log entry flowing through the logger system.
 */

import type { LogLevel } from "@/enums/log-level.enum";
import type { LogContext } from "@/types/log-context.type";

/** A single log entry flowing through the logger system. */
export interface ILogEntry {
  /** Severity level. */
  level: LogLevel;
  /** Log message. */
  message: string;
  /** Logger context (class/service name). */
  context: string;
  /** Structured metadata. */
  meta?: LogContext;
  /** Timestamp of the log entry (ISO string or Date). */
  timestamp: Date | string;
  /** Channel name that produced this entry. */
  channel?: string;
  /** Error object attached to error/fatal entries. */
  error?: Error;
}
