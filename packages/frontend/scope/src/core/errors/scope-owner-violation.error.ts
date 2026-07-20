/**
 * @file scope-owner-violation.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when a cross-owner access attempt is detected.
 */

import { ScopeError } from "./scope.error";

/**
 * Thrown when an operation attempts to access or modify scope data
 * belonging to a different owner (cross-owner boundary violation).
 *
 * Maps to HTTP 403 Forbidden in NestJS exception filters.
 */
export class ScopeOwnerViolationError extends ScopeError {
  public readonly code = "SCOPE_OWNER_VIOLATION" as const;
}
