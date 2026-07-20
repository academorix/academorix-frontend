/**
 * @file analytics.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the analytics / tracking system.
 */

/** Token for the AnalyticsManager instance. */
export const ANALYTICS_MANAGER = Symbol.for("ANALYTICS_MANAGER");

/** Token for the analytics module configuration. */
export const ANALYTICS_CONFIG = Symbol.for("ANALYTICS_CONFIG");

/** Metadata key for the `@AnalyticsProvider()` decorator. */
export const ANALYTICS_PROVIDER_METADATA_KEY = "stackra:analytics:provider";
