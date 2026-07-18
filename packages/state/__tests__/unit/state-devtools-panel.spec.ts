/**
 * @file state-devtools-panel.spec.ts
 * @module @stackra/state/tests/unit
 * @description Unit tests for the `StateDevtoolsPanel` — verifies
 *   the `@DevtoolsPanel(...)` decorator stamps the expected metadata,
 *   the panel implements `IDevtoolsPanel`, and the badge counter
 *   reflects the number of registered stores.
 */

import 'reflect-metadata';

import { describe, expect, it } from 'vitest';
import { DEVTOOLS_PANEL_METADATA_KEY } from '@stackra/contracts';

import { StateDevtoolsPanel } from '@/react/devtools/state.devtools-panel';
import type { StateRegistry, StoreEntry } from '@/core/registries/state.registry';

/** Build a StateRegistry stub that reports N registered stores. */
function makeRegistry(storeCount: number): StateRegistry {
  const entries: StoreEntry[] = [];
  for (let i = 0; i < storeCount; i++) {
    entries.push({
      name: `store-${i}`,
      token: Symbol(`STORE_${i}`),
      // The panel doesn't call `.state` in the class-level tests —
      // the view does. A raw shape here is enough for the badge
      // spec to assert against.
      store: { state: {} } as unknown as StoreEntry['store'],
      initialState: {},
    });
  }
  return {
    getAll: () => entries,
  } as unknown as StateRegistry;
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe('StateDevtoolsPanel', () => {
  it('stamps @DevtoolsPanel metadata with id "state", data category, order 40', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, StateDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('state');
    expect(metadata?.title).toBe('State');
    expect(metadata?.category).toBe('data');
    expect(metadata?.order).toBe(40);
  });

  it('constructs with a registry and exposes IDevtoolsPanel fields', () => {
    const panel = new StateDevtoolsPanel(makeRegistry(2));
    expect(panel.id).toBe('state');
    expect(panel.title).toBe('State');
    expect(panel.category).toBe('data');
    expect(panel.order).toBe(40);
    expect(panel.view.type).toBe('component');
  });

  it('badge() returns the number of registered stores', () => {
    expect(new StateDevtoolsPanel(makeRegistry(3)).badge()).toBe(3);
  });

  it('badge() returns null when the registry holds zero stores', () => {
    expect(new StateDevtoolsPanel(makeRegistry(0)).badge()).toBeNull();
  });

  it('badge() returns null when the registry is absent', () => {
    // Missing registry is a valid state — the panel is optional-inject
    // for headless / test scenarios where StateModule.forRoot() isn't wired.
    expect(new StateDevtoolsPanel().badge()).toBeNull();
  });

  it('badge() returns null when the registry throws on read', () => {
    // fail-soft — a broken registry must not crash the badge.
    const throwingRegistry = {
      getAll: (): never => {
        throw new Error('boom');
      },
    } as unknown as StateRegistry;
    expect(new StateDevtoolsPanel(throwingRegistry).badge()).toBeNull();
  });
});
