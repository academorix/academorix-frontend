/**
 * @file scope.error.ts
 * @module @stackra/scope/errors
 * @description Base error class for all scope system errors.
 *   All specific scope errors extend this class for consistent handling.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Base Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Base error for all scope system errors.
 *
 * Provides a machine-readable `code` and optional `ownerId` for
 * context-aware error reporting. NestJS exception filters map
 * subclasses to appropriate HTTP status codes.
 */
export abstract class ScopeError extends Error {
  /** Machine-readable error code (e.g., 'SCOPE_NOT_FOUND'). */
  public abstract readonly code: string;

  /** Owner ID associated with the error context (if applicable). */
  public readonly ownerId?: string;

  /**
   * @param message - Human-readable error description
   * @param ownerId - Optional owner ID for context
   */
  public constructor(message: string, ownerId?: string) {
    super(message);
    this.name = this.constructor.name;
    this.ownerId = ownerId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
