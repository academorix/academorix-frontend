/**
 * @file logger.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Context-bound logger instance contract.
 */

import type { LogContext } from "@/types/log-context.type";

/** Context-bound logger instance. */
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  notice(message: string, context?: LogContext): void;
  warning(message: string, context?: LogContext): void;
  error(message: string, errorOrContext?: Error | unknown, context?: LogContext): void;
  critical(message: string, context?: LogContext): void;
  alert(message: string, context?: LogContext): void;
  emergency(message: string, context?: LogContext): void;
  fatal(message: string, errorOrContext?: Error | unknown, context?: LogContext): void;
  log(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
}
