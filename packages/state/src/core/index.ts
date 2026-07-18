/**
 * @file index.ts
 * @module @stackra/state
 * @description Root barrel — the primary import surface for the reactive
 *   store layer.
 *
 *   Owns store registration (`StateModule`), the store registry, broadcasters
 *   (cross-tab / realtime / persistence), storage adapters, and the store
 *   primitives. React hooks ship through the `./react` subpath; test helpers
 *   through `./testing`. The store-backed query layer lives in the separate
 *   `@stackra/query` package.
 *
 *   ## Architecture
 *   ```
 *   Service mutates store → Store notifies subscribers → hook re-renders
 *                         → CrossTabBroadcaster    → other tabs
 *                         → PersistenceBroadcaster → IStorage (via @stackra/storage)
 *   RealtimeBroadcaster ← WebSocket → Store update → hook re-renders
 *   ```
 */

// ═══════════════════════════════════════════════════════════════════════
// Module
// ═══════════════════════════════════════════════════════════════════════
export { StateModule } from './state.module';

// ═══════════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════════
export { StateRegistry, type StoreEntry } from './registries';

// ═══════════════════════════════════════════════════════════════════════
// Broadcasters
// ═══════════════════════════════════════════════════════════════════════
export { CrossTabBroadcaster, RealtimeBroadcaster, PersistenceBroadcaster } from './broadcasters';

// Storage adapters removed since v0.2 — persistence is now delegated
// to `@stackra/storage`. Configure a named `IStorage` instance in
// `WebStorageModule.forRoot({ stores })` and set
// `persistence: '<instance>'` on the store feature config.

// ═══════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════
export { createReactiveStore } from './utils';

// ═══════════════════════════════════════════════════════════════════════
// Package-owned types & interfaces
// ═══════════════════════════════════════════════════════════════════════
export type { StateSelector } from './types';
export type { StateFeatureOptions } from './interfaces';

// ═══════════════════════════════════════════════════════════════════════
// TanStack Store — intentional 3rd-party convenience re-export.
// `@stackra/state` IS the TanStack Store integration, so consumers get the
// primitive from one place. (See contract-reexports steering: allowed.)
// ═══════════════════════════════════════════════════════════════════════
export { Store } from '@tanstack/store';
