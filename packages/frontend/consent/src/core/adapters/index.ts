/**
 * @file index.ts
 * @module @stackra/consent/core/adapters
 * @description Barrel export for platform-agnostic consent storage
 *   adapters. Every adapter lives here since the storage-backed one
 *   already handles both web (localStorage / sessionStorage /
 *   IndexedDB) and native (AsyncStorage) via `@stackra/storage`.
 */

export { MemoryConsentAdapter } from "./memory-consent.adapter";
export { StorageBackedConsentAdapter } from "./storage-backed-consent.adapter";
