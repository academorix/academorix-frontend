/**
 * @file index.ts
 * @module @academorix/http/errors
 *
 * @description
 * Public barrel for error-normalization helpers. The `HttpError` class
 * itself lives in `@academorix/core/errors` so packages without an
 * HTTP dep can still import + narrow on it.
 */

export { toHttpError, toNetworkError } from "./normalize.util";

// Re-export for consumer convenience — a package that already depends
// on @academorix/http shouldn't need to also depend on core just for
// the error class.
export { HttpError, isHttpError } from "@academorix/core/errors";
