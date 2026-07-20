/**
 * @file storage.error.ts
 * @module @stackra/storage/core/errors
 * @description Base error class for every fault raised inside
 *   `@stackra/storage`. Subclasses narrow the failure mode
 *   (driver-not-registered, quota-exceeded, …).
 */

/**
 * Base error class for the storage package.
 *
 * @example
 * ```typescript
 * throw new StorageError('storage instance is not initialised');
 * ```
 */
export class StorageError extends Error {
  /**
   * @param message - Human-readable failure description.
   * @param options - Standard `ErrorOptions` (currently only `cause`).
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageError';
  }
}
