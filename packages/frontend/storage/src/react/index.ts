/**
 * @file index.ts
 * @module @stackra/storage/react
 * @description Public API for the web subpath of `@stackra/storage`.
 *
 *   Contains browser-only bindings:
 *
 *   - `WebStorageModule.forRoot(...)` — DI module that registers the
 *     four web drivers (`localStorage`, `sessionStorage`,
 *     `indexedDB`, `cookie`) on the manager.
 *   - `LocalStorageStore`, `SessionStorageStore`, `IndexedDbStore`,
 *     `CookieStore` for callers that want to construct one manually
 *     (e.g. tests).
 *   - `useStorage`, `useStorageValue` React hooks.
 */

// Module
export { WebStorageModule } from './web-storage.module';

// Stores
export {
  WebStorageBase,
  LocalStorageStore,
  SessionStorageStore,
  IndexedDbStore,
  CookieStore,
  type WebStorageBaseConfig,
  type IndexedDbStoreConfig,
  type CookieStoreConfig,
} from './stores';

// Hooks
export {
  useStorage,
  useStorageValue,
  type UseStorageValueOptions,
  type UseStorageValueMeta,
  type UseStorageValueResult,
} from './hooks';

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contribution
// ════════════════════════════════════════════════════════════════════════════════
export {
  StorageDevtoolsPanel,
  StorageDevtoolsPanelView,
  type StorageDevtoolsPanelViewProps,
} from './devtools';
