/**
 * @file index.ts
 * @module @stackra/config/core/errors
 * @description Public API barrel for the `errors` category — one file
 *   per error class. Every subclass extends `ConfigError`, so a
 *   single `instanceof ConfigError` catch discriminates the whole
 *   family.
 */

export { ConfigError } from "./config.error";
export { ConfigMissingKeyError } from "./config-missing-key.error";
export { ConfigReadonlyError } from "./config-readonly.error";
export { ConfigValidationError } from "./config-validation.error";
export { ConfigEnvMissingError } from "./config-env-missing.error";
export { ConfigEnvInvalidError } from "./config-env-invalid.error";
