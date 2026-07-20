/**
 * @file index.ts
 * @module @stackra/scope/errors
 * @description Barrel export for all scope error classes.
 */

export { ScopeError } from "./scope.error";
export { ScopeNotFoundError } from "./scope-not-found.error";
export { ScopeConflictError } from "./scope-conflict.error";
export { ScopeCircularReferenceError } from "./scope-circular-reference.error";
export { ScopeDepthExceededError } from "./scope-depth-exceeded.error";
export { ScopeDefinitionInUseError } from "./scope-definition-in-use.error";
export { ScopeResolutionTimeoutError } from "./scope-resolution-timeout.error";
export { ScopeOwnerViolationError } from "./scope-owner-violation.error";
export { ScopeValidationError } from "./scope-validation.error";
export { ScopeContextRequiredError } from "./scope-context-required.error";
