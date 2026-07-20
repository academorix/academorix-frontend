/**
 * @file pretty-colors.constant.ts
 * @module @stackra/logger/formatters
 * @description ANSI color constants for the pretty formatter.
 */

/** ANSI color codes per log level. */
export const LEVEL_COLORS: Record<string, string> = {
  emergency: "\x1b[41m\x1b[37m",
  alert: "\x1b[41m",
  critical: "\x1b[31m\x1b[1m",
  error: "\x1b[31m",
  warning: "\x1b[33m",
  notice: "\x1b[36m",
  info: "\x1b[32m",
  debug: "\x1b[90m",
};

/** ANSI reset code. */
export const RESET = "\x1b[0m";

/** ANSI dim code. */
export const DIM = "\x1b[2m";

/** ANSI bold code. */
export const BOLD = "\x1b[1m";
