/**
 * @file scope-conflict.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when a duplicate slug, namespace, or entity_id is detected.
 */

import { ScopeError } from "./scope.error";

/**
 * Thrown when a duplicate scope slug, namespace, or entity mapping is detected.
 *
 * Maps to HTTP 409 Conflict in NestJS exception filters.
 */
export class ScopeConflictError extends ScopeError {
  public readonly code = "SCOPE_CONFLICT" as const;
}
