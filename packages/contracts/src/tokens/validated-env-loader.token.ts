/**
 * @file validated-env-loader.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the validated-env merge sentinel.
 *
 *   When `ConfigModule.forRoot` runs with `validate` / `validationSchema`,
 *   the validated environment record is merged into the configuration
 *   host object under a well-known property via this loader. The
 *   token is bound by `@stackra/config`; consumers do not inject it.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * DI token for the validated-env merge sentinel.
 *
 * Runs alongside `CONFIGURATION_LOADER`, after schema validation has
 * succeeded, to write the validated env values onto the configuration
 * host record. Split from `CONFIGURATION_LOADER` because validation is
 * opt-in — modules without a schema never provide this token.
 */
export const VALIDATED_ENV_LOADER = Symbol("VALIDATED_ENV_LOADER");
