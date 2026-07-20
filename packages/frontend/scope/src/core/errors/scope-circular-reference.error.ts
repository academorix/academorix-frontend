/**
 * @file scope-circular-reference.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when an operation would create a circular reference in the scope tree.
 */

import { ScopeError } from './scope.error';

/**
 * Thrown when creating or updating a definition/node would introduce a cycle.
 *
 * Maps to HTTP 422 Unprocessable Entity in NestJS exception filters.
 */
export class ScopeCircularReferenceError extends ScopeError {
  public readonly code = 'SCOPE_CIRCULAR_REF' as const;
}
