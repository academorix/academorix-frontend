/**
 * @file config-validation.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown when `ConfigModule.forRoot`'s `validate`
 *   function or `validationSchema` rejects the merged env record.
 */

import { ConfigError } from "./config.error";

/**
 * Thrown during `ConfigModule.forRoot` when validation fails.
 *
 * Wraps a Joi / Zod / custom-validator failure so the caller sees a
 * consistent `ConfigError` regardless of which validator was used.
 * The original cause is preserved on `Error.cause` (Node 16.9+).
 *
 * @example
 * ```typescript
 * try {
 *   await ApplicationFactory.create(AppModule);
 * } catch (err) {
 *   if (err instanceof ConfigValidationError) {
 *     console.error(err.message, err.cause);
 *   }
 * }
 * ```
 */
export class ConfigValidationError extends ConfigError {
  /**
   * @param details - Validator-supplied failure detail (Joi
   *   `error.message`, Zod `error.issues`, or a hand-rolled string).
   * @param cause - Optional underlying error object, preserved on
   *   `Error.cause` for stack-trace debugging.
   */
  public constructor(details: string, cause?: unknown) {
    super(`Config validation error: ${details}`, "CONFIG_VALIDATION");
    // `Error.cause` (Node 16.9+ / all supported browsers) preserves
    // the original error while surfacing a friendlier top-level
    // message.
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}
