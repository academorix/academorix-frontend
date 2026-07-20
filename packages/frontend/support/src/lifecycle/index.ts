/**
 * @file index.ts
 * @module @stackra/support/lifecycle
 * @description Public API barrel for framework-lifecycle helpers.
 *
 *   `createSeedLoader` + `seedLoaderToken` are the canonical way for
 *   feature-module `forFeature(...)` calls to seed additional entries
 *   into a registry — no bootstrap classes, no sentinel factories.
 */

export { createSeedLoader, seedLoaderToken } from "./seed-loader.util";
