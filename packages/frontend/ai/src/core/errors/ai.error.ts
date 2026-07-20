/**
 * @file ai.error.ts
 * @module @stackra/ai/core/errors
 * @description Root error class for the AI package. Every typed AI error
 *   extends this base so consumers can `catch (err) { if (err instanceof
 *   AiError) ... }` without importing five subclasses.
 */

/**
 * Base class for every error thrown by `@stackra/ai`.
 *
 * Concrete subclasses (`AiTransportError`, `AiAuthError`,
 * `AiToolExecutionError`, `AiDraftError`, `AiSchemaError`) preserve the
 * originating cause under `.cause` when one is provided.
 */
export class AiError extends Error {
  /**
   * @param message - Human-readable error description.
   * @param cause - The originating error, when re-throwing from a lower layer.
   */
  public constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    // Restore prototype chain for Error subclasses under CommonJS transpile.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
