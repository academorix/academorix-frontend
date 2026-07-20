/**
 * @file index.ts
 * @module @stackra/logger/core/constants
 * @description Barrel export for logger constants.
 *
 *   `LOGGER_CONFIG_INTERNAL` is intentionally NOT re-exported by the
 *   package's public `src/core/index.ts` barrel — it is a
 *   package-internal binding token consumed only by classes inside
 *   `@stackra/logger`. External consumers reach the same config via
 *   `@Inject(loggerConfig.KEY)` on a `registerAs` factory (see
 *   `@stackra/config`).
 */

export { LOGGER_CONFIG_INTERNAL } from "./logger-config-internal.constant";

// NOTE: `DEFAULT_LOGGER_CONFIG` was removed in the `@stackra/config`
// migration — defaults now live inline in the app-level `registerAs`
// factory via `env('LOG_LEVEL', 'debug')` calls. See
// `.kiro/specs/stackra-config-package/PLAN.md` §5.2.
