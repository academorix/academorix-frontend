/**
 * @file colors.constant.ts
 * @module @stackra/container/devtools
 * @description ANSI color codes for terminal output.
 */

/** ANSI color escape codes. */
export const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
} as const;
