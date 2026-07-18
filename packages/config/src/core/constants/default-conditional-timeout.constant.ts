/**
 * @file default-conditional-timeout.constant.ts
 * @module @stackra/config/core/constants
 * @description Default timeout (ms) used by
 *   `ConditionalModule.registerWhen` when the caller doesn't override it.
 *
 * @derived @nestjs/config@4.0.4 — lib/conditional.module.ts (default `timeout` literal) (MIT, © Kamil Myśliwiec)
 */

/**
 * Default deadline (5s) for `ConditionalModule.registerWhen` to wait
 * for `ConfigModule.envVariablesLoaded` before throwing.
 *
 * Matches the upstream `@nestjs/config` default so behavior is
 * predictable during the fork migration. Consumers override via
 * `IConditionalModuleOptions.timeout`.
 */
export const DEFAULT_CONDITIONAL_TIMEOUT = 5000 as const;
