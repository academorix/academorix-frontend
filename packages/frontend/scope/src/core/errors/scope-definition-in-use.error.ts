/**
 * @file scope-definition-in-use.error.ts
 * @module @stackra/scope/errors
 * @description Thrown when attempting to delete a definition that has active nodes.
 */

import { ScopeError } from './scope.error';

/**
 * Thrown when attempting to delete a scope definition that still has active nodes.
 *
 * Maps to HTTP 409 Conflict in NestJS exception filters.
 */
export class ScopeDefinitionInUseError extends ScopeError {
  public readonly code = 'SCOPE_DEF_IN_USE' as const;
}
