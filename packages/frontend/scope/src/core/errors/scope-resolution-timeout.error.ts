/**
 * @file scope-resolution-timeout.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when scope value resolution exceeds the configured timeout.
 */

import { ScopeError } from "./scope.error";

/**
 * Thrown when cascading value resolution exceeds the configured timeout.
 *
 * Maps to HTTP 504 Gateway Timeout in NestJS exception filters.
 */
export class ScopeResolutionTimeoutError extends ScopeError {
  public readonly code = "SCOPE_RESOLUTION_TIMEOUT" as const;
}
