/**
 * @file scope-validation.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when input validation fails (invalid slug, namespace, or value).
 */

import { ScopeError } from "./scope.error";

/**
 * Thrown when input validation fails for scope operations.
 *
 * Covers invalid slug format, invalid namespace format, and consumer
 * validator rejection.
 *
 * Maps to HTTP 400 Bad Request in NestJS exception filters.
 */
export class ScopeValidationError extends ScopeError {
  public readonly code = "SCOPE_VALIDATION" as const;
}
