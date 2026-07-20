/**
 * @file pwa.error.ts
 * @module @stackra/pwa/core/errors
 * @description Base error class for every PWA-runtime error.
 */

/**
 * Base class for every error thrown by `@stackra/pwa`.
 *
 * Subclasses carry a stable machine-readable `code` so consumers can
 * branch on categorised failures without matching on `.message`.
 */
export abstract class PwaError extends Error {
  /** Machine-readable error code (e.g. `'PWA_OFFLINE_QUEUE_FULL'`). */
  public abstract readonly code: string;

  /**
   * @param message - Human-readable error description.
   */
  public constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Preserve prototype for `instanceof` checks after cross-realm boundaries.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
