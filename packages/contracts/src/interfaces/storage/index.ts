/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/storage
 * @description Barrel export for the storage interface family.
 */

export type { IStorage, IStorageSetOptions } from "./storage.interface";
export type { IStorageManager, IStorageDriverCreator } from "./storage-manager.interface";
export type {
  IStorageModuleOptions,
  IStorageStoreConfig,
  IStorageConfig,
} from "./storage-module-options.interface";
