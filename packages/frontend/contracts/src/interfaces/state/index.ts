/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/state
 * @description Barrel export for reactive-state interfaces.
 */

export type { IStateStorage } from "./state-storage.interface";
export type {
  IStoreFeatureConfig,
  PersistenceTarget,
  UpdateStrategy,
} from "./store-feature-config.interface";
export type { IQueryConfig, QueryLiveMode } from "./query-config.interface";
