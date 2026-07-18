/**
 * @file pipeline.error.ts
 * @module @stackra/pipeline/errors
 * @description Pipeline-specific error class for all pipeline operation failures.
 *   Thrown when a pipe cannot be resolved, the pipeline is misconfigured,
 *   or a pipe throws during execution.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Error Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when a pipeline operation fails.
 *
 * Covers scenarios such as:
 * - Pipe resolution failure (string pipe not found in container)
 * - Invalid pipe type provided
 * - Pipeline method not found on a pipe object
 * - Pipe execution failure (wrapped original error)
 *
 * @example
 * ```typescript
 * throw new PipelineError(
 *   'Pipe "ValidateInput" could not be resolved from the container.',
 *   'PIPE_RESOLUTION_FAILED',
 * );
 * ```
 */
export class PipelineError extends Error {
  /**
   * Machine-readable error code for programmatic handling.
   */
  public readonly code: string;

  /**
   * The original error that caused this pipeline error, if any.
   */
  public override readonly cause?: Error;

  /**
   * @param message - Human-readable description of what went wrong
   * @param code - Machine-readable error code
   * @param cause - The original error that triggered this pipeline error
   */
  public constructor(message: string, code: string = "PIPELINE_ERROR", cause?: Error) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, PipelineError.prototype);
  }
}
