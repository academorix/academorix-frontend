/**
 * @file scope-not-found.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when a scope definition, node, or value is not found.
 */

import { ScopeError } from "./scope.error";

/**
 * Thrown when a scope definition, node, or value is not found.
 *
 * Maps to HTTP 404 Not Found in NestJS exception filters.
 */
export class ScopeNotFoundError extends ScopeError {
  public readonly code = "SCOPE_NOT_FOUND" as const;
}
