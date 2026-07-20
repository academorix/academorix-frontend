/**
 * @file conflict-resolution.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description The result of resolving a document conflict.
 */

import type { ConflictStrategy } from "@/enums/conflict-strategy.enum";

/**
 * The outcome of resolving an {@link import('./conflict.interface').IConflict}.
 */
export interface IConflictResolution<T = unknown> {
  /** The resolved document that the sync engine will persist. */
  resolved: T;

  /** The strategy that produced the resolution. */
  strategy: ConflictStrategy;

  /** Timestamp when the resolution was decided. */
  timestamp: Date;

  /** Which side won — or `'merged'` for custom resolvers. */
  winner: "local" | "remote" | "merged";
}
