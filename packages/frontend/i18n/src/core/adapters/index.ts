/**
 * @file index.ts
 * @module @stackra/i18n/core/adapters
 * @description Barrel export for cross-platform i18n adapters.
 *   Platform-specific adapters live in `../react/adapters` (direction)
 *   and `../native/adapters` (direction). The locale-storage adapter
 *   is unified here — one class, `IStorage`-backed, resolves per
 *   platform via `@stackra/storage`.
 */

export { StorageBackedLocaleAdapter } from "./storage-backed-locale.adapter";
