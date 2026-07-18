/**
 * @file mock-settings-manager.ts
 * @module @stackra/settings/testing/mocks
 * @description Minimal `ISettingsManager` implementation for tests.
 *
 *   Backs every named instance by the same underlying store, honouring
 *   per-group overrides. Tests that need distinct stores per group can
 *   pass a factory to build fresh instances.
 */

import type { ISettingsDriverCreator, ISettingsManager, ISettingsStore } from '@stackra/contracts';

import { MemorySettingsStore } from '@/core/stores/memory-settings.store';

/** Options accepted by `MockSettingsManager`. */
export interface IMockSettingsManagerOptions {
  /**
   * Default instance name. Instances are lazily created on first
   * access. Defaults to `'memory'`.
   */
  readonly defaultInstance?: string;

  /**
   * Optional map of pre-registered store instances. Tests seeding
   * data ahead of time populate this map.
   */
  readonly instances?: Readonly<Record<string, ISettingsStore>>;

  /**
   * Optional per-group overrides — mirrors the real config's
   * `groups[groupKey].store` shape. Values map a group key to an
   * instance name.
   */
  readonly groupOverrides?: Readonly<Record<string, string>>;
}

/** Test-facing `ISettingsManager`. */
export class MockSettingsManager implements ISettingsManager {
  private readonly instances: Map<string, ISettingsStore>;

  private readonly customCreators = new Map<string, ISettingsDriverCreator>();

  private readonly groupOverrides: Readonly<Record<string, string>>;

  private defaultInstance: string;

  public constructor(options: IMockSettingsManagerOptions = {}) {
    this.defaultInstance = options.defaultInstance ?? 'memory';
    this.instances = new Map(Object.entries(options.instances ?? {}));
    this.groupOverrides = options.groupOverrides ?? {};
  }

  /** @inheritDoc */
  public instance(name?: string): ISettingsStore {
    const key = name ?? this.defaultInstance;
    let store = this.instances.get(key);
    if (!store) {
      store = new MemorySettingsStore();
      this.instances.set(key, store);
    }
    return store;
  }

  /** @inheritDoc */
  public storeForGroup(groupKey: string): ISettingsStore {
    const override = this.groupOverrides[groupKey];
    return this.instance(override ?? this.defaultInstance);
  }

  /** @inheritDoc */
  public hasInstance(name?: string): boolean {
    return this.instances.has(name ?? this.defaultInstance);
  }

  /** @inheritDoc */
  public extend(driverName: string, creator: ISettingsDriverCreator): this {
    this.customCreators.set(driverName, creator);
    return this;
  }

  /** @inheritDoc */
  public getDefaultInstance(): string {
    return this.defaultInstance;
  }
}
