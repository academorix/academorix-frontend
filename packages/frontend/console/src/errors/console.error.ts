/**
 * @file console.error.ts
 * @module @stackra/console/errors
 * @description Base error class for all console framework errors.
 */

/**
 * Base error for the @stackra/console package.
 *
 * All console-specific errors extend this class, enabling
 * catch blocks to distinguish console errors from other exceptions.
 */
export class ConsoleError extends Error {
  /**
   * @param message - Human-readable error description
   */
  public constructor(message: string) {
    super(message);
    this.name = "ConsoleError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
