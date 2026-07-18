/**
 * @file devtools-panels-registry.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Unit tests for `DevtoolsPanelsRegistry`.
 */

// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { DevtoolsPanelsRegistry } from '@/core/registries/devtools-panels.registry';
import { createMockDevtoolsPanel } from '@/testing/create-mock-devtools-panel.util';

describe('DevtoolsPanelsRegistry', () => {
  it('registers a panel and surfaces it via list()', () => {
    const registry = new DevtoolsPanelsRegistry();
    const panel = createMockDevtoolsPanel({ id: 'a', title: 'A' });
    registry.register(panel);
    expect(registry.list()).toHaveLength(1);
    expect(registry.list()[0]!.id).toBe('a');
  });

  it('is last-wins per id', () => {
    const registry = new DevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a', title: 'First' }));
    registry.register(createMockDevtoolsPanel({ id: 'a', title: 'Second' }));
    expect(registry.list()).toHaveLength(1);
    expect(registry.find('a')?.title).toBe('Second');
  });

  it('sorts by (order, id)', () => {
    const registry = new DevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'z', order: 1 }));
    registry.register(createMockDevtoolsPanel({ id: 'a', order: 2 }));
    registry.register(createMockDevtoolsPanel({ id: 'b', order: 2 }));
    expect(registry.list().map((p) => p.id)).toEqual(['z', 'a', 'b']);
  });

  it('unregister returns to empty state', () => {
    const registry = new DevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    registry.unregister('a');
    expect(registry.list()).toHaveLength(0);
    expect(registry.find('a')).toBeNull();
  });

  it('unregister is a no-op for a missing id', () => {
    const registry = new DevtoolsPanelsRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.unregister('does-not-exist');
    expect(listener).not.toHaveBeenCalled();
  });

  it('list() reference is stable across reads', () => {
    const registry = new DevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    expect(registry.list()).toBe(registry.list());
  });

  it('list() reference changes on mutation', () => {
    const registry = new DevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    const before = registry.list();
    registry.register(createMockDevtoolsPanel({ id: 'b' }));
    expect(registry.list()).not.toBe(before);
  });

  it('subscribe fires exactly once per mutation', () => {
    const registry = new DevtoolsPanelsRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    registry.register(createMockDevtoolsPanel({ id: 'b' }));
    registry.unregister('a');
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('subscribe returns an unsubscribe function', () => {
    const registry = new DevtoolsPanelsRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);
    unsubscribe();
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('byCategory groups panels by their category', () => {
    const registry = new DevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'net', category: 'network' }));
    registry.register(createMockDevtoolsPanel({ id: 'pin', category: 'pinned' }));
    registry.register(createMockDevtoolsPanel({ id: 'mod' /* default 'modules' */ }));
    const grouped = registry.byCategory();
    expect(grouped.get('pinned')?.map((p) => p.id)).toEqual(['pin']);
    expect(grouped.get('network')?.map((p) => p.id)).toEqual(['net']);
    expect(grouped.get('modules')?.map((p) => p.id)).toEqual(['mod']);
  });

  it('onModuleDestroy clears every subscriber and panel', () => {
    const registry = new DevtoolsPanelsRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    registry.onModuleDestroy();
    expect(registry.list()).toHaveLength(0);
    registry.register(createMockDevtoolsPanel({ id: 'b' }));
    // Listener should have been dropped by onModuleDestroy — only
    // the initial register call fired it.
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
