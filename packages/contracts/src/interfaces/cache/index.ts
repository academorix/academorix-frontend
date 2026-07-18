/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Barrel export for cache interfaces.
 */

export type { ICacheStore } from "./cache-store.interface";
export type { ICacheManager } from "./cache-manager.interface";
export type {
  ICacheEventBase,
  ICacheHitPayload,
  ICacheMissPayload,
  ICacheWrittenPayload,
  ICacheForgottenPayload,
  ICacheFlushedPayload,
  ICacheIncrementedPayload,
  ICacheDecrementedPayload,
  ICacheTouchedPayload,
} from "./cache-event-payloads.interface";
