/**
 * @file log-reporter.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Reporter contract — writes log entries to a destination.
 */

import type { ILogEntry } from "./log-entry.interface";

/** Reporter — writes log entries to a destination (console, file, HTTP, etc.). */
export interface ILogReporter {
  /** Reporter identifier referenced in channel config. */
  name: string;
  /** Write a log entry to the destination. */
  write(entry: ILogEntry): void | Promise<void>;
  /** Optional cleanup on shutdown. */
  flush?(): void | Promise<void>;
}
