/**
 * @file null-store.spec.ts
 * @module @stackra/storage/test/unit
 * @description Coverage for the no-op `NullStore` — every read
 *   resolves to `null`, every write is swallowed.
 */

import { describe, it, expect } from 'vitest';

import { NullStore } from '@/core/stores/null.store';

describe('NullStore', () => {
  it('swallows every write and reads back null', async () => {
    const store = new NullStore();
    await store.set('a', 1);
    await store.set('b', { nested: true });
    expect(await store.get('a')).toBeNull();
    expect(await store.get('b')).toBeNull();
  });

  it('reports absence for every key', async () => {
    const store = new NullStore();
    await store.set('a', 1);
    expect(await store.has('a')).toBe(false);
  });

  it('reports an empty key list', async () => {
    const store = new NullStore();
    await store.set('a', 1);
    expect(await store.keys()).toEqual([]);
  });

  it('is safe to clear / delete anything', async () => {
    const store = new NullStore();
    await expect(store.clear()).resolves.toBeUndefined();
    await expect(store.delete('a')).resolves.toBeUndefined();
  });
});
