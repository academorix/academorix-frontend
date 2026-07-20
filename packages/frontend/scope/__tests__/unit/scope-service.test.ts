/**
 * @file scope-service.test.ts
 * @module @stackra/scope/__tests__/unit
 * @description ScopeService — switch, emulate, restore, subscribe, value
 *   resolution, node-tree loading, and useSyncExternalStore-friendly
 *   snapshot semantics.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ScopeService } from '@/core/services/scope.service';
import type { IScopeContext, IScopeDataSource, IScopeNodeTreeNode } from '@/core/interfaces';

function ctx(nodeId: string, emulated = false): IScopeContext {
  return {
    ownerId: 'org-1',
    nodeId,
    level: 'venue',
    entityId: nodeId,
    path: [nodeId],
    ancestors: { venue: nodeId },
    emulated,
  };
}

function nodeTree(): IScopeNodeTreeNode[] {
  return [
    {
      id: 'node-owner',
      ownerId: 'org-1',
      level: 'owner',
      entityId: 'org-1',
      label: 'Acme',
      children: [
        {
          id: 'node-venue-1',
          ownerId: 'org-1',
          level: 'venue',
          entityId: 'venue-1',
          label: 'Downtown',
          children: [],
        },
      ],
    },
  ];
}

function createDataSource(): IScopeDataSource {
  return {
    resolveScope: vi.fn(async (nodeId: string) => ctx(nodeId)),
    loadTree: vi.fn(async () => nodeTree()),
    resolveValue: vi.fn(async () => 'resolved'),
    persist: vi.fn(),
  };
}

describe('ScopeService', () => {
  let ds: IScopeDataSource;
  let svc: ScopeService;

  beforeEach(() => {
    ds = createDataSource();
    svc = new ScopeService({ initialScope: ctx('node-a') }, ds);
  });

  it('exposes the initial scope', () => {
    expect(svc.getScope()?.nodeId).toBe('node-a');
  });

  it('loads the node tree on init when not seeded', async () => {
    const fresh = new ScopeService(undefined, ds);
    await fresh.onModuleInit();
    expect(ds.loadTree).toHaveBeenCalled();
    expect(fresh.getTree()).toHaveLength(1);
    expect(fresh.getTree()[0]?.id).toBe('node-owner');
    expect(fresh.getTree()[0]?.children[0]?.id).toBe('node-venue-1');
  });

  it('setScope resolves + persists + clears emulation', async () => {
    await svc.setScope('node-b');
    expect(ds.resolveScope).toHaveBeenCalledWith('node-b');
    expect(svc.getScope()?.nodeId).toBe('node-b');
    expect(ds.persist).toHaveBeenCalled();
    expect(svc.isEmulating()).toBe(false);
  });

  it('emulate flags emulated + restore returns to original', async () => {
    await svc.emulate('node-x');
    expect(svc.isEmulating()).toBe(true);
    expect(svc.getScope()?.nodeId).toBe('node-x');
    svc.restore();
    expect(svc.isEmulating()).toBe(false);
    expect(svc.getScope()?.nodeId).toBe('node-a');
  });

  it('notifies subscribers on change', async () => {
    const listener = vi.fn();
    const off = svc.subscribe(listener);
    await svc.setScope('node-c');
    expect(listener).toHaveBeenCalled();
    off();
  });

  it('resolveValue delegates to the data source for the active node', async () => {
    const value = await svc.resolveValue('settings', 'invoice.prefix');
    expect(ds.resolveValue).toHaveBeenCalledWith('node-a', 'settings', 'invoice.prefix');
    expect(value).toBe('resolved');
  });

  it('is a no-op without a data source', async () => {
    const bare = new ScopeService({ initialScope: ctx('node-a') });
    await bare.setScope('node-z');
    expect(bare.getScope()?.nodeId).toBe('node-a');
  });

  describe('getSnapshot', () => {
    it('returns the same object identity when nothing changes', () => {
      const a = svc.getSnapshot();
      const b = svc.getSnapshot();
      expect(a).toBe(b);
    });

    it('swaps the snapshot identity on every emit', async () => {
      const before = svc.getSnapshot();
      await svc.setScope('node-b');
      const after = svc.getSnapshot();
      expect(after).not.toBe(before);
      expect(after.scope?.nodeId).toBe('node-b');
    });

    it('mirrors the initial state fields', () => {
      const s = svc.getSnapshot();
      expect(s.scope?.nodeId).toBe('node-a');
      expect(s.tree).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.isEmulating).toBe(false);
    });

    it('reflects tree load after onModuleInit', async () => {
      const fresh = new ScopeService(undefined, ds);
      const before = fresh.getSnapshot();
      await fresh.onModuleInit();
      const after = fresh.getSnapshot();
      expect(before.tree).toEqual([]);
      expect(after.tree).toHaveLength(1);
      expect(after.isLoading).toBe(false);
    });

    it('reflects emulation state', async () => {
      await svc.emulate('node-x');
      const s = svc.getSnapshot();
      expect(s.isEmulating).toBe(true);
      expect(s.scope?.emulated).toBe(true);
    });
  });

  describe('fault tolerance', () => {
    it('is fail-soft when a subscriber throws', async () => {
      svc.subscribe(() => {
        throw new Error('boom');
      });
      const ok = vi.fn();
      svc.subscribe(ok);
      // A throwing subscriber must not stop later subscribers.
      await svc.setScope('node-b');
      expect(ok).toHaveBeenCalled();
    });

    it('is fail-soft when loadTree rejects', async () => {
      const failing: IScopeDataSource = {
        resolveScope: async (id) => ctx(id),
        loadTree: async () => {
          throw new Error('offline');
        },
      };
      const fresh = new ScopeService(undefined, failing);
      await fresh.onModuleInit();
      expect(fresh.getTree()).toEqual([]);
      expect(fresh.isLoading()).toBe(false);
    });
  });
});
