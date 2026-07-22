/**
 * @file index.ts
 * @module @stackra/logger/core
 * @description Public API for the core logger package.
 *   Re-exports all public symbols needed for logging.
 */

// ============================================================================
// Module
// ============================================================================
export { LoggerModule } from "./logger.module";
export type { ILoggerModuleAsyncOptions } from "./interfaces/logger-module-async-options.interface";

// ============================================================================
// Services
// ============================================================================
export { LoggerManager } from "./services/logger-manager.service";
export { Logger } from "./services/logger.service";
export { EmergencyLogger } from "./services/emergency-logger.service";
export { ContextRepository } from "./services/context-repository.service";
export { ReporterLoader } from "./services/reporter-loader.service";
export { LoggerShutdownService } from "./services/logger-shutdown.service";

// ============================================================================
// Reporters
// ============================================================================
export { ConsoleReporter } from "./reporters/console.reporter";
export { JsonReporter } from "./reporters/json.reporter";
export { SilentReporter } from "./reporters/silent.reporter";
export { BufferedReporterWrapper } from "./reporters/buffered-reporter.wrapper";

// ============================================================================
// Enrichers
// ============================================================================
export { RedactionEnricher } from "./enrichers";
export { SamplingEnricher } from "./enrichers";
export { InterpolationEnricher } from "./enrichers";
export { ContextEnricher } from "./enrichers";

// ============================================================================
// Formatters
// ============================================================================
export { JsonFormatter } from "./formatters";
export { PrettyFormatter } from "./formatters";

// ============================================================================
// Decorators
// ============================================================================
export { Reporter } from "./decorators";

// ============================================================================
// Utilities
// ============================================================================
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./utils";

// ============================================================================
// Deprecation-shim re-export — lets consumers migrating a single
// file `import { registerAs } from '@stackra/logger'` for one release
// cycle without changing the import path. Removed in v0.2; switch
// to `import { registerAs } from '@stackra/config'` at your own
// pace.
// ============================================================================
/** @deprecated Import `registerAs` directly from `@stackra/config`. Removed in v0.2. */
export { registerAs } from "@stackra/config";

// ============================================================================
// Interfaces (internal — ILogChannel, IChannelTap)
// ============================================================================
export type { ILogChannel } from "./interfaces/log-channel.interface";
export type { IChannelTap } from "./interfaces/channel-tap.interface";

// NOTE: contract symbols (LOGGER_MANAGER, LOGGER_CONFIG, LOGGER_EVENTS,
// LogLevel, LOG_LEVEL_PRIORITY, ILogger, ILoggerManager, …) are owned by
// @stackra/contracts — consumers import them from there directly.

export * from "./constants";
export * from "./interfaces";
export * from "./reporters";
export * from "./services";
