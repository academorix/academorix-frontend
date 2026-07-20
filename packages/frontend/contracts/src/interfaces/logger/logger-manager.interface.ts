/**
 * @file logger-manager.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Central logger manager contract.
 */

import type { ILogger } from "./logger.interface";

/** Central logger manager — creates context-bound loggers. */
export interface ILoggerManager {
  /** Create a context-bound logger instance. */
  create(context: string): ILogger;

  /** Create a logger bound to a specific channel. */
  channel(context: string, channelName: string): ILogger;
}
