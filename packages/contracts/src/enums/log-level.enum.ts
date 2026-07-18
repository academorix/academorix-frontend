/**
 * @file log-level.enum.ts
 * @module @stackra/contracts/enums
 * @description Log severity levels (RFC 5424 ordering) plus a numeric
 *   priority map used by the logger to compare and filter entries.
 */

/** Log severity levels (ordered from most to least severe). */
export enum LogLevel {
  EMERGENCY = "emergency",
  ALERT = "alert",
  CRITICAL = "critical",
  ERROR = "error",
  WARNING = "warning",
  NOTICE = "notice",
  INFO = "info",
  DEBUG = "debug",
  /** Alias for WARNING — common shorthand. */
  WARN = "warning",
  /** Alias for EMERGENCY — used for unrecoverable errors. */
  FATAL = "emergency",
  /** Pseudo-level that suppresses all output. */
  SILENT = "silent",
}

/** Priority map — lower number = higher severity. */
export const LOG_LEVEL_PRIORITY: Record<string, number> = {
  [LogLevel.EMERGENCY]: 0,
  [LogLevel.ALERT]: 1,
  [LogLevel.CRITICAL]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.WARNING]: 4,
  [LogLevel.NOTICE]: 5,
  [LogLevel.INFO]: 6,
  [LogLevel.DEBUG]: 7,
  silent: 8,
};
