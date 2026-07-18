/**
 * @file storage-devtools-panel.spec.ts
 * @module @stackra/storage/tests/unit
 * @description Unit tests for the `StorageDevtoolsPanel` — verifies
 *   the `@DevtoolsPanel(...)` decorator stamps the expected
 *   metadata, the panel implements `IDevtoolsPanel`, and the badge
 *   counter reflects the number of configured instances.
 */

import 'reflect-metadata';

import { describe, expect, it } from 'vitest';
import { DEVTOOLS_PANEL_METADATA_KEY, type IStorageConfig } from '@stackra/contracts';

import { StorageDevtoolsPanel } from '@/react/devtools/storage.devtools-panel';

/** Build a fixture config with N stores. */
function makeConfig(storeCount: number): IStorageConfig {
  const stores: IStorageConfig['stores'] = {};
  for (let i = 0; i < storeCount; i++) {
    stores[`store-${i}`] = { driver: 'memory' };
  }
  return {
    default: 'store-0',
    stores,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe('StorageDevtoolsPanel', () => {
  it('stamps @DevtoolsPanel metadata with id "storage", data category, order 30', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, StorageDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('storage');
    expect(metadata?.title).toBe('Storage');
    expect(metadata?.category).toBe('data');
    expect(metadata?.order).toBe(30);
  });

  it('constructs with a config and exposes IDevtoolsPanel fields', () => {
    const panel = new StorageDevtoolsPanel(makeConfig(2));
    expect(panel.id).toBe('storage');
    expect(panel.title).toBe('Storage');
    expect(panel.category).toBe('data');
    expect(panel.order).toBe(30);
    expect(panel.view.type).toBe('component');
  });

  it('badge() returns the number of configured instances', () => {
    expect(new StorageDevtoolsPanel(makeConfig(3)).badge()).toBe(3);
  });

  it('badge() returns null when the config has zero instances', () => {
    expect(new StorageDevtoolsPanel(makeConfig(0)).badge()).toBeNull();
  });

  it('badge() returns null when the config is absent', () => {
    // Missing config is a valid state — the panel is optional-inject
    // for headless / test scenarios where the storage module isn't wired.
    expect(new StorageDevtoolsPanel().badge()).toBeNull();
  });

  it('badge() returns null when the config throws on read', () => {
    // fail-soft — a broken config object must not crash the badge.
    const throwingConfig = {
      get stores(): never {
        throw new Error('boom');
      },
    } as unknown as IStorageConfig;
    expect(new StorageDevtoolsPanel(throwingConfig).badge()).toBeNull();
  });
});
