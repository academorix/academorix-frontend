/**
 * @file mock-storage-manager.ts
 * @module @stackra/storage/testing
 * @description In-memory `IStorageManager` implementation for tests.
 *
 *   Resolves named `IStorage` instances from an internal registry.
 *   If a name hasn't been asked for yet, a fresh `MockStorage` is
 *   spun up on first access — so tests never have to pre-configure
 *   which stores exist.
 */

import type { IStorage, IStorageDriverCreator, IStorageManager } from '@stackra/contracts';

import { MockStorage } from './mock-storage';

/**
 * In-memory `IStorageManager` for testing.
 *
 * @example
 * ```typescript
 * import { MockStorageManager } from '@stackra/storage/testing';
 *
 * const manager = new MockStorageManager();
 * await manager.instance('preferences').set('theme', 'dark');
 * expect(await manager.instance('preferences').get('theme')).toBe('dark');
 * ```
 */
export class MockStorageManager implements IStorageManager {
  /** Named instance registry — created lazily on `instance(name)`. */
  public readonly instances = new Map<string, IStorage>();

  /** Custom driver creators registered via `extend()`. */
  private readonly creators = new Map<string, IStorageDriverCreator>();

  /** Configurable default instance name. */
  private defaultInstance: string = 'default';

  /** @inheritdoc */
  public getDefaultInstance(): string {
    return this.defaultInstance;
  }

  /**
   * Test helper — change the default instance name.
   *
   * @param name - The new default.
   */
  public setDefaultInstance(name: string): void {
    this.defaultInstance = name;
  }

  /** @inheritdoc */
  public instance(name?: string): IStorage {
    const key = name ?? this.defaultInstance;
    const cached = this.instances.get(key);
    if (cached) return cached;

    const creator = this.creators.get(key);
    // Custom creators receive a synthetic config bag identifying the
    // instance name — matches the shape production drivers see.
    const store = creator ? (creator({ __instanceName: key }) as IStorage) : new MockStorage();
    this.instances.set(key, store);
    return store;
  }

  /** @inheritdoc */
  public hasInstance(name?: string): boolean {
    return this.instances.has(name ?? this.defaultInstance);
  }

  /** @inheritdoc */
  public extend(driverName: string, creator: IStorageDriverCreator): this {
    this.creators.set(driverName, creator);
    // Invalidate any cached instance so the next `instance(name)`
    // call re-creates it through the new creator.
    this.instances.delete(driverName);
    return this;
  }
}
