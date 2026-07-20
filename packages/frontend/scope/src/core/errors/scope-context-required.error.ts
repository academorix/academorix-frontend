/**
 * @file scope-context-required.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when a scoped operation executes without an active scope context.
 */

import { ScopeError } from "./scope.error";

/**
 * Thrown when a @Scoped() entity query executes without an active scope context.
 *
 * This is a fail-closed safety mechanism — the system never returns unscoped
 * data. Either set up the scope context via middleware (backend) or
 * ScopeProvider (frontend), or use @BypassScopeFilter() for admin operations.
 *
 * Maps to HTTP 500 Internal Server Error in NestJS exception filters.
 */
export class ScopeContextRequiredError extends ScopeError {
  public readonly code = "SCOPE_CONTEXT_REQUIRED" as const;
}
