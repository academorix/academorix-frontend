/**
 * @file index.ts
 * @module @stackra/storage/react/stores
 * @description Barrel export for the web-only stores.
 */

export { WebStorageBase, type WebStorageBaseConfig } from "./web-storage-base.store";
export { LocalStorageStore } from "./local-storage.store";
export { SessionStorageStore } from "./session-storage.store";
export { IndexedDbStore, type IndexedDbStoreConfig } from "./indexed-db.store";
export { CookieStore, type CookieStoreConfig } from "./cookie.store";
