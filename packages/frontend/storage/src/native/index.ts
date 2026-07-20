/**
 * @file index.ts
 * @module @stackra/storage/native
 * @description Public API for the React Native subpath of
 *   `@stackra/storage`.
 *
 *   Contains RN-only bindings:
 *
 *   - `NativeStorageModule.forRoot(...)` — DI module that registers
 *     the `asyncStorage` driver on the manager.
 *   - `AsyncStorageStore` for callers that want to construct one
 *     manually (e.g. tests).
 */

export { NativeStorageModule } from "./native-storage.module";
export { AsyncStorageStore, type AsyncStorageStoreConfig } from "./stores";
