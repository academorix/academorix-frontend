/**
 * @file memory-store.spec.ts
 * @module @stackra/storage/test/unit
 * @description Behavioural coverage for `MemoryStore` — every method
 *   on the `IStorage` contract plus the TTL expiry path.
 */

import { describe, it, expect, vi } from 'vitest';

import { MemoryStore } from '@/core/stores/memory.store';

describe('MemoryStore', () => {
  it('get() returns null for an unknown key', async () => {
    const store = new MemoryStore();
    expect(await store.get('missing')).toBeNull();
  });

  it('set() then get() round-trips a value', async () => {
    const store = new MemoryStore();
    await store.set('a', 42);
    expect(await store.get<number>('a')).toBe(42);
  });

  it('delete() removes a stored value', async () => {
    const store = new MemoryStore();
    await store.set('a', 'v');
    await store.delete('a');
    expect(await store.get('a')).toBeNull();
  });

  it('clear() empties the store', async () => {
    const store = new MemoryStore();
    await store.set('a', 1);
    await store.set('b', 2);
    await store.clear();
    expect(await store.keys()).toEqual([]);
  });

  it('has() returns true for a present, non-expired key', async () => {
    const store = new MemoryStore();
    await store.set('a', 'v');
    expect(await store.has('a')).toBe(true);
    expect(await store.has('missing')).toBe(false);
  });

  it('keys() lists every non-expired key', async () => {
    const store = new MemoryStore();
    await store.set('a', 1);
    await store.set('b', 2);
    expect((await store.keys()).sort()).toEqual(['a', 'b']);
  });

  it('honours TTL — expired entries return null and are pruned', async () => {
    const store = new MemoryStore();
    // 0 ttl and negative ttl are treated as "no ttl" by wrapTtl —
    // use a tiny positive ttl and mock the clock instead.
    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(Date, 'now');
    spy.mockReturnValue(now);
    await store.set('a', 'v', { ttlSeconds: 1 });

    // Value present while inside TTL.
    expect(await store.get<string>('a')).toBe('v');

    // Move past the TTL and re-read.
    spy.mockReturnValue(now + 2_000);
    expect(await store.get('a')).toBeNull();
    // Passive expiration should have dropped the row.
    expect(await store.has('a')).toBe(false);
    expect(await store.keys()).toEqual([]);

    spy.mockRestore();
  });
});
