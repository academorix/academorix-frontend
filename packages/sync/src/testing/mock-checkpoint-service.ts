/**
 * @file mock-checkpoint-service.ts
 * @module @stackra/sync/testing
 * @description In-memory `CheckpointService`-compatible mock for
 *   tests. Stores checkpoints in a plain `Map<string, ISyncCheckpoint>`
 *   keyed by collection name — no `IStorage`, no async persistence,
 *   no lifecycle wiring.
 */

import type { ISyncCheckpoint } from '@stackra/contracts';

/**
 * In-memory mock of `CheckpointService`.
 *
 * Register under `CheckpointService` (or a dedicated token) in tests
 * that exercise the sync engine's checkpoint interactions without
 * spinning up a real `StorageManager`.
 *
 * @example
 * ```ts
 * import { MockCheckpointService } from '@stackra/sync/testing';
 *
 * const checkpoints = new MockCheckpointService();
 * await checkpoints.save('users', { collection: 'users', ... });
 * expect(await checkpoints.load('users')).toEqual(...);
 * ```
 */
export class MockCheckpointService {
  /** Internal per-collection map. Public for direct test assertions. */
  public readonly entries = new Map<string, ISyncCheckpoint>();

  /** Save a checkpoint for a collection. */
  public async save(collection: string, checkpoint: ISyncCheckpoint): Promise<void> {
    this.entries.set(collection, checkpoint);
  }

  /** Load the checkpoint for a specific collection. */
  public async load(collection: string): Promise<ISyncCheckpoint | null> {
    return this.entries.get(collection) ?? null;
  }

  /** Load every persisted checkpoint. */
  public async loadAll(): Promise<ISyncCheckpoint[]> {
    return Array.from(this.entries.values());
  }

  /** Delete a single checkpoint. */
  public async delete(collection: string): Promise<void> {
    this.entries.delete(collection);
  }

  /** Delete every persisted checkpoint. */
  public async deleteAll(): Promise<void> {
    this.entries.clear();
  }
}
