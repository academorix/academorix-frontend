/**
 * @file monitoring.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the error-monitoring system.
 */

/** Token for the MonitoringManager instance. */
export const MONITORING_MANAGER = Symbol.for("MONITORING_MANAGER");

/** Token for the monitoring module configuration. */
export const MONITORING_CONFIG = Symbol.for("MONITORING_CONFIG");

/** Metadata key for the `@MonitoringProvider()` decorator. */
export const MONITORING_PROVIDER_METADATA_KEY = "stackra:monitoring:provider";
