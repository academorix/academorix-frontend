/**
 * @file conflict-strategy.enum.ts
 * @module @stackra/contracts/enums
 * @description Resolution strategy for a document conflict during sync.
 */

/**
 * Strategy the conflict resolver applies to a document conflict.
 */
export enum ConflictStrategy {
  /** The document with the later timestamp wins. */
  LastWriteWins = "last-write-wins",
  /** The remote (server) copy always wins. */
  RemoteWins = "remote-wins",
  /** The local (client) copy always wins. */
  LocalWins = "local-wins",
  /** A caller-supplied resolver function decides. */
  Custom = "custom",
}
