/**
 * @file action.error.ts
 * @module @stackra/actions/core/errors
 * @description Base action-layer error. Every other action error extends
 *   this so consumers can catch every failure with one `instanceof` check.
 */

/**
 * Base action error class.
 */
export class ActionError extends Error {
  /** Machine-friendly error code. */
  public readonly code: string;

  /** Additional context (descriptor kind, permission name, …). */
  public readonly context?: Record<string, unknown>;

  public constructor(
    message: string,
    code: string = 'ACTION_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ActionError';
    this.code = code;
    this.context = context;
  }
}
