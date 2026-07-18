/**
 * @file index.ts
 * @module @stackra/scope/core/adapters
 * @description Barrel export for cross-platform scope adapters.
 *   Platform-specific adapters are no longer needed — the
 *   `StorageBackedScopePersistAdapter` works on every platform via
 *   `@stackra/storage`'s manager.
 */

export { StorageBackedScopePersistAdapter } from './storage-backed-scope-persist.adapter';
