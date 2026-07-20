/**
 * @file conflict.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description A detected conflict between the local and remote versions
 *   of a single document during sync.
 */

/**
 * A conflict between the local and remote versions of a single document.
 *
 * The generic parameter `T` carries the document shape so custom resolvers
 * can operate on typed data.
 */
export interface IConflict<T = unknown> {
  /** Primary key of the conflicting document. */
  id: string;

  /** Collection / table the document belongs to. */
  collection: string;

  /** Local copy of the document. */
  local: T;

  /** Remote copy of the document. */
  remote: T;

  /** Timestamp of the local write. */
  localTimestamp: Date;

  /** Timestamp of the remote write. */
  remoteTimestamp: Date;

  /** Names of the fields whose values differ between the two versions. */
  conflictingFields: string[];
}
