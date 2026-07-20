/**
 * @file scope-depth-exceeded.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when the scope tree depth exceeds the configured maximum.
 */

import { ScopeError } from './scope.error';

/**
 * Thrown when creating a node or definition would exceed the maximum tree depth.
 *
 * Maps to HTTP 422 Unprocessable Entity in NestJS exception filters.
 */
export class ScopeDepthExceededError extends ScopeError {
  public readonly code = 'SCOPE_DEPTH_EXCEEDED' as const;
}
