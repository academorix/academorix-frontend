/**
 * @file log-formatter.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Formatter contract — serializes log entries for output.
 */

import type { ILogEntry } from "./log-entry.interface";

/** Formatter — serializes a log entry into a string for output. */
export interface ILogFormatter {
  /** Formatter identifier. */
  name?: string;
  /** Format a log entry into a string. */
  format(entry: ILogEntry): string;
}
