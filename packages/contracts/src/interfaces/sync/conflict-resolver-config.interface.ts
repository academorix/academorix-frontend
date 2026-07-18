/**
 * @file conflict-resolver-config.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Configuration for the conflict resolver.
 */

import type { ConflictStrategy } from "@/enums/conflict-strategy.enum";
import type { IConflictResolverFn } from "./conflict-resolver-fn.interface";

/**
 * Configuration for the {@link ConflictResolver} service.
 */
export interface IConflictResolverConfig {
  /** Default strategy applied when no per-collection strategy matches. */
  defaultStrategy?: ConflictStrategy;

  /** Per-collection strategies keyed by collection name. */
  collectionStrategies?: Record<string, ConflictStrategy>;

  /** Custom resolver functions keyed by collection name. */
  customResolvers?: Record<string, IConflictResolverFn>;
}
