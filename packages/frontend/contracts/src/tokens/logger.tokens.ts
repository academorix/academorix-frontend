/**
 * @file logger.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the logger system.
 *
 *   NOTE: `LOGGER_CONFIG` used to live here. It was removed in the
 *   `@stackra/config` migration — `LoggerModule.forRoot` now binds
 *   the resolved config under a package-internal symbol
 *   (`LOGGER_CONFIG_INTERNAL` in `@stackra/logger`) and consumers who
 *   want to read the same value do so via
 *   `@Inject(loggerConfig.KEY)` on an app-owned `registerAs(...)`
 *   factory. See `.kiro/specs/stackra-config-package/PLAN.md` §5.2.
 */

/** Token for the LoggerManager instance. */
export const LOGGER_MANAGER = Symbol.for("LOGGER_MANAGER");

/**
 * Metadata key stamped by the `@Reporter('name')` class decorator.
 * The `LoggerManager` reads it at bootstrap via
 * `discovery.getProvidersByMetadata(LOGGER_REPORTER_METADATA_KEY)`
 * and registers each discovered instance by name.
 *
 * String key (not `Symbol.for(...)`) for cross-realm stability + the
 * repo-wide `stackra:<domain>:<name>` convention.
 */
export const LOGGER_REPORTER_METADATA_KEY = "stackra:logger:reporter";
