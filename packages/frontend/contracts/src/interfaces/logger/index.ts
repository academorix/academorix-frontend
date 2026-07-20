/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Barrel export for logger interfaces.
 */

export type { ILogEntry } from "./log-entry.interface";
export type { ILogger } from "./logger.interface";
export type { ILoggerManager } from "./logger-manager.interface";
export type { ILogReporter } from "./log-reporter.interface";
export type { ILogEnricher } from "./log-enricher.interface";
export type { ILogFormatter } from "./log-formatter.interface";
export type {
  ILogChannelConfig,
  IChannelTapConfig,
  ILoggerModuleConfig,
} from "./logger-module-config.interface";
export type {
  ILoggerMessageLoggedPayload,
  ILoggerChannelResolvedPayload,
  ILoggerReporterRegisteredPayload,
  ILoggerFormatterRegisteredPayload,
  ILoggerLevelChangedPayload,
  ILoggerFlushCompletedPayload,
} from "./logger-event-payloads.interface";
