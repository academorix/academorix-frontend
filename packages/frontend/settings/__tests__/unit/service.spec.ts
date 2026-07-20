/**
 * @file service.spec.ts
 * @description Unit tests for `SettingsService` — verifies sync
 *   reads, async hydration, debounced persist, subscribers, and
 *   defaults resolution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControlType } from '@stackra/contracts';
import type { ISettingsConfig, ISettingsManager, ISettingsStore } from '@stackra/contracts';

import {
  Field,
  Setting,
  SettingsRegistry,
  SettingsService,
  MemorySettingsStore,
  DEFAULT_SETTINGS_CONFIG,
} from '@/core';

/**
 * A tiny manager that always returns the same store — enough for the
 * service tests without spinning up the full manager class.
 */
function createTinyManager(store: ISettingsStore): ISettingsManager {
  return {
    instance: () => store,
    storeForGroup: () => store,
    hasInstance: () => true,
    extend() {
      return this;
    },
    getDefaultInstance: () => 'memory',
  };
}

@Setting({ key: 'display', label: 'Display' })
class DisplaySettings {
  @Field({ control: ControlType.Toggle, label: 'Compact', defaultValue: false })
  compact: boolean = false;

  @Field({ control: ControlType.Select, label: 'Theme', defaultValue: 'system' })
  theme: string = 'system';
}

describe('SettingsService', () => {
  let registry: SettingsRegistry;
  let store: MemorySettingsStore;
  let service: SettingsService;

  const config: ISettingsConfig = {
    ...DEFAULT_SETTINGS_CONFIG,
    debounce: false, // simpler assertions
  };

  beforeEach(() => {
    registry = new SettingsRegistry();
    registry.registerClass(DisplaySettings);
    store = new MemorySettingsStore();
    service = new SettingsService(config, registry, createTinyManager(store));
  });

  it('get(dto) returns defaults on cache miss', () => {
    const values = service.get(DisplaySettings);
    expect(values.compact).toBe(false);
    expect(values.theme).toBe('system');
  });

  it('set(dto, key, value) updates the cache and persists', () => {
    service.set(DisplaySettings, 'compact', true);
    expect(service.get(DisplaySettings).compact).toBe(true);
    expect(store.load('display')).toEqual({ compact: true, theme: 'system' });
  });

  it('setMany(dto, partial) merges multiple fields', () => {
    service.setMany(DisplaySettings, { compact: true, theme: 'dark' });
    expect(service.get(DisplaySettings)).toEqual({ compact: true, theme: 'dark' });
  });

  it('reset(dto) clears the store and restores defaults', () => {
    service.setMany(DisplaySettings, { compact: true, theme: 'dark' });
    service.reset(DisplaySettings);
    expect(service.get(DisplaySettings)).toEqual({ compact: false, theme: 'system' });
    expect(store.load('display')).toEqual({});
  });

  it('subscribe(groupKey, cb) fires on mutations and stops after unsubscribe', () => {
    const cb = vi.fn();
    const unsubscribe = service.subscribe('display', cb);
    service.set(DisplaySettings, 'compact', true);
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
    service.set(DisplaySettings, 'theme', 'dark');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('hydrateValues merges without triggering a persist', () => {
    // Prime the store with a stale value so we can detect writes.
    store.save('display', { compact: false, theme: 'system' });
    service.hydrateValues('display', { theme: 'dark' });
    expect(service.get(DisplaySettings).theme).toBe('dark');
    // Store was not overwritten by hydrate.
    expect(store.load('display').compact).toBe(false);
  });

  it('exportAll / importAll round-trip', () => {
    service.setMany(DisplaySettings, { compact: true, theme: 'dark' });
    const snapshot = service.exportAll();
    service.reset(DisplaySettings);
    expect(service.get(DisplaySettings).compact).toBe(false);
    service.importAll(snapshot);
    expect(service.get(DisplaySettings)).toEqual({ compact: true, theme: 'dark' });
  });

  it('debounces persist writes when config.debounce is true', async () => {
    vi.useFakeTimers();
    const debouncedService = new SettingsService(
      { ...DEFAULT_SETTINGS_CONFIG, debounceMs: 100 },
      registry,
      createTinyManager(store)
    );
    debouncedService.set(DisplaySettings, 'compact', true);
    debouncedService.set(DisplaySettings, 'theme', 'dark');
    // Not yet persisted.
    expect(store.load('display')).toEqual({});
    await vi.advanceTimersByTimeAsync(150);
    expect(store.load('display')).toEqual({ compact: true, theme: 'dark' });
    vi.useRealTimers();
  });

  it('loadAll uses the store loadAll primitive when present', async () => {
    // Build a bulk-capable store that returns two groups' values in one call.
    const bulkCalls: number[] = [];
    const bulkStore: ISettingsStore = {
      driver: 'bulk-mock',
      load: () => ({}),
      save: () => undefined,
      clear: () => undefined,
      loadAll: () => {
        bulkCalls.push(Date.now());
        return Promise.resolve({
          display: { compact: true, theme: 'dark' },
        });
      },
    };
    const svc = new SettingsService(config, registry, createTinyManager(bulkStore));

    await svc.loadAll();

    // One round trip regardless of group count.
    expect(bulkCalls.length).toBe(1);
    // Cache hydrated.
    expect(svc.get(DisplaySettings)).toEqual({ compact: true, theme: 'dark' });
  });

  it('loadAll falls back to per-group load when store has no loadAll', async () => {
    // Store without loadAll — the service must iterate registered groups.
    const perGroupCalls: string[] = [];
    const legacyStore: ISettingsStore = {
      driver: 'legacy',
      load: (key) => {
        perGroupCalls.push(key);
        return { compact: true, theme: 'system' };
      },
      save: () => undefined,
      clear: () => undefined,
    };
    const svc = new SettingsService(config, registry, createTinyManager(legacyStore));

    await svc.loadAll();

    // One call per registered group (only `display` in this test).
    expect(perGroupCalls).toEqual(['display']);
    expect(svc.get(DisplaySettings).compact).toBe(true);
  });

  it('loadAll is fail-soft on per-group errors', async () => {
    // A legacy store that throws on load.
    const brokenStore: ISettingsStore = {
      driver: 'broken',
      load: () => {
        throw new Error('kaboom');
      },
      save: () => undefined,
      clear: () => undefined,
    };
    const svc = new SettingsService(config, registry, createTinyManager(brokenStore));

    // Should NOT throw — the broken group is skipped, others (none here) proceed.
    // We only assert loadAll's contract here; reading through the
    // broken store separately would raise (that's a broken system
    // not a broken loadAll).
    await expect(svc.loadAll()).resolves.toBeUndefined();
  });

  it('async store hydrates the cache in the background', async () => {
    // Build an async store that resolves after a tick.
    const asyncStore: ISettingsStore = {
      driver: 'async',
      load: () => Promise.resolve({ compact: true, theme: 'dark' }),
      save: async () => {},
      clear: async () => {},
    };
    const svc = new SettingsService(config, registry, createTinyManager(asyncStore));

    const cb = vi.fn();
    svc.subscribe('display', cb);

    // First read returns defaults.
    expect(svc.get(DisplaySettings).compact).toBe(false);
    // After the promise resolves, subscribers fire and the cache is
    // updated.
    await Promise.resolve();
    await Promise.resolve();
    expect(cb).toHaveBeenCalled();
    expect(svc.get(DisplaySettings).compact).toBe(true);
  });
});
