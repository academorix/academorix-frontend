/**
 * @file sync.config.ts
 * @module @stackra/sync/config
 * @description Application-level offline sync configuration.
 *   Consumed by `SyncModule.forRoot()` at bootstrap.
 */

import { defineConfig } from '@stackra/sync';
import { ConflictStrategy } from '@stackra/contracts';

export const syncConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Base URL
  |--------------------------------------------------------------------------
  |
  | Root URL the sync engine hits for pull / push endpoints. Every
  | collection URL is resolved relative to this base.
  |
  */
  baseUrl: '/api/sync',

  /*
  |--------------------------------------------------------------------------
  | Endpoints
  |--------------------------------------------------------------------------
  |
  | Collection → endpoint path mapping. When omitted for a collection,
  | the engine falls back to `${baseUrl}/${collection}`.
  |
  */
  endpoints: {},

  /*
  |--------------------------------------------------------------------------
  | Default Conflict Strategy
  |--------------------------------------------------------------------------
  |
  | Resolution rule when a pushed operation conflicts with a remote
  | change. Per-collection overrides live in `strategies`. Options:
  |   - `LastWriteWins` — most recent timestamp wins (default)
  |   - `ServerWins`    — server value always wins
  |   - `ClientWins`    — client value always wins
  |   - `Manual`        — surface for user resolution
  |
  */
  defaultStrategy: ConflictStrategy.LastWriteWins,

  /*
  |--------------------------------------------------------------------------
  | Auto-Sync Interval (ms)
  |--------------------------------------------------------------------------
  |
  | Background pull cadence when the app is online. `0` disables the
  | interval — callers drive syncs manually via `syncEngine.sync()`.
  |
  */
  autoSyncInterval: 60_000,

  /*
  |--------------------------------------------------------------------------
  | Auto-Sync on Reconnect
  |--------------------------------------------------------------------------
  |
  | Fire a sync the moment the browser reports back online.
  |
  */
  autoSyncOnReconnect: true,

  /*
  |--------------------------------------------------------------------------
  | Batch Size
  |--------------------------------------------------------------------------
  |
  | How many operations the push service ships per HTTP request.
  |
  */
  batchSize: 50,

  /*
  |--------------------------------------------------------------------------
  | Timeout (ms)
  |--------------------------------------------------------------------------
  |
  | Per-request timeout for pull / push HTTP calls.
  |
  */
  timeout: 30_000,

  /*
  |--------------------------------------------------------------------------
  | Storage
  |--------------------------------------------------------------------------
  |
  | Named `@stackra/storage` instance where the operation queue +
  | checkpoints persist. `indexedDB` is durable across reloads;
  | `memory` is fine for tests.
  |
  */
  storage: 'indexedDB',

  /*
  |--------------------------------------------------------------------------
  | Queue Persistence
  |--------------------------------------------------------------------------
  |
  | Persist the pending-operation queue across reloads so writes made
  | offline survive a refresh.
  |
  */
  enableQueuePersistence: true,

  /*
  |--------------------------------------------------------------------------
  | Max Retries
  |--------------------------------------------------------------------------
  |
  | How many times a failing push retries before parking in the
  | queue's dead-letter store.
  |
  */
  maxRetries: 5,
});
