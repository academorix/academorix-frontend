/**
 * @file sync-direction.enum.ts
 * @module @stackra/contracts/enums
 * @description Direction of a sync operation.
 */

/**
 * Direction of a sync operation.
 */
export enum SyncDirection {
  /** Pull remote changes into the local store. */
  Pull = "pull",
  /** Push local changes to the remote server. */
  Push = "push",
  /** Push first, then pull. */
  Bidirectional = "bidirectional",
}
