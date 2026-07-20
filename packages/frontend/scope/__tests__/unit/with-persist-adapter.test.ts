/**
 * @file with-persist-adapter.test.ts
 * @module @stackra/scope/__tests__/unit
 * @description Behavioural tests for {@link withPersistAdapter} — verifies
 *   the wrapping preserves every method by reference, delegates
 *   `persist` to the underlying source first, then forwards the node id
 *   to the persist adapter.
 */

import { describe, it, expect, vi } from 'vitest';

import { withPersistAdapter } from '@/core/utils/with-persist-adapter.util';
import type {
  IScopeContext,
  IScopeDataSource,
  IScopeNodeTreeNode,
  IScopePersistAdapter,
} from '@/core/interfaces';

function ctx(nodeId: string): IScopeContext {
  return {
    ownerId: 'org-1',
    nodeId,
    level: 'venue',
    entityId: nodeId,
    path: [nodeId],
    ancestors: { venue: nodeId },
  };
}

function makeAdapter(): IScopePersistAdapter & {
  persist: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} {
  return {
    persist: vi.fn(async () => {}),
    restore: vi.fn(async () => null),
    clear: vi.fn(async () => {}),
  };
}

function makeSource(): IScopeDataSource & {
  resolveScope: ReturnType<typeof vi.fn>;
  loadTree: ReturnType<typeof vi.fn>;
  resolveValue: ReturnType<typeof vi.fn>;
  persist: ReturnType<typeof vi.fn>;
} {
  return {
    resolveScope: vi.fn(async (id: string) => ctx(id)),
    loadTree: vi.fn(async () => [] as IScopeNodeTreeNode[]),
    resolveValue: vi.fn(async () => null),
    persist: vi.fn(),
  };
}

describe('withPersistAdapter', () => {
  it('forwards resolveScope + loadTree + resolveValue unchanged', async () => {
    const source = makeSource();
    const adapter = makeAdapter();
    const wrapped = withPersistAdapter(source, adapter);

    await wrapped.resolveScope('a');
    await wrapped.loadTree();
    await wrapped.resolveValue?.('a', 'ns', 'k');

    expect(source.resolveScope).toHaveBeenCalledWith('a');
    expect(source.loadTree).toHaveBeenCalled();
    expect(source.resolveValue).toHaveBeenCalledWith('a', 'ns', 'k');
  });

  it('runs the source persist BEFORE calling the adapter', () => {
    const source = makeSource();
    const adapter = makeAdapter();
    const order: string[] = [];
    source.persist.mockImplementation(() => order.push('source'));
    adapter.persist.mockImplementation(async () => {
      order.push('adapter');
    });

    const wrapped = withPersistAdapter(source, adapter);
    wrapped.persist?.(ctx('n-1'));

    // Adapter is fired synchronously (fire-and-forget) after source.
    expect(order).toEqual(['source', 'adapter']);
    expect(adapter.persist).toHaveBeenCalledWith('n-1');
  });

  it('still fires the adapter even when the source has no persist', () => {
    const source: IScopeDataSource = {
      resolveScope: async (id) => ctx(id),
      loadTree: async () => [],
    };
    const adapter = makeAdapter();
    const wrapped = withPersistAdapter(source, adapter);

    wrapped.persist?.(ctx('n-2'));

    expect(adapter.persist).toHaveBeenCalledWith('n-2');
  });

  it('omits resolveValue on the wrapped source when the original did not have one', () => {
    const source: IScopeDataSource = {
      resolveScope: async (id) => ctx(id),
      loadTree: async () => [],
    };
    const adapter = makeAdapter();
    const wrapped = withPersistAdapter(source, adapter);

    expect(wrapped.resolveValue).toBeUndefined();
  });
});
