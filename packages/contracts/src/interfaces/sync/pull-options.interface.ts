/**
 * @file pull-options.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Options passed to a pull operation.
 */

/**
 * Options for a single-collection pull.
 */
export interface IPullOptions {
  /** Base URL for the remote sync API. */
  baseUrl: string;

  /** Cursor to resume from (`null` means "start from the beginning"). */
  cursor: string | null;

  /** Page size for cursor-based pulls. */
  limit: number;

  /** Only pull documents modified after this timestamp. */
  since?: Date;
}
