/**
 * @file index.ts
 * @module @stackra/sdui/core/errors
 * @description Public API barrel for the core `errors` category —
 *   re-exports the base `SduiError` and its specializations
 *   (`SduiSchemaVersionError` / `SduiValidationError`).
 */

export { SduiError, SduiSchemaVersionError, SduiValidationError } from "./sdui.error";
