/**
 * Base error class for the HTTP package.
 *
 * Every error raised by `@stackra/http` extends this class so a
 * single `instanceof HttpError` check identifies any failure inside
 * the package, regardless of the specific subclass.
 *
 * @module @stackra/http/errors/http
 */

/**
 * Base error for the HTTP package.
 */
export class HttpError extends Error {
  /** Error name visible in stack traces. */
  public override readonly name: string = "HttpError";

  /** Machine-readable error code. */
  public readonly code: string = "HTTP_ERROR";

  /** Optional underlying cause. */
  public override readonly cause?: Error;

  /**
   * @param message - Human-readable message.
   * @param cause   - Optional underlying error.
   */
  public constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;

    if (
      typeof (Error as unknown as { captureStackTrace?: Function }).captureStackTrace === "function"
    ) {
      (Error as unknown as { captureStackTrace: Function }).captureStackTrace(
        this,
        this.constructor,
      );
    }
  }
}
