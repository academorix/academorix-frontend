/**
 * @file undoable-queue.service.test.ts
 * @module @stackra/query/__tests__
 * @description Covers add / commit / cancel resolution, timer
 *   expiry, snapshot subscription semantics, and fail-soft listener
 *   isolation for `UndoableQueueService`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UndoableQueueService } from '@/core/services/undoable-queue.service';
import type { IUndoableMutation } from '@stackra/contracts';

const mk = (id: string, timeoutMs = 5000): IUndoableMutation => ({
  id,
  createdAt: new Date(),
  timeoutMs,
});

describe('UndoableQueueService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with "commit" when the timeout elapses', async () => {
    const queue = new UndoableQueueService();
    const promise = queue.add(mk('a', 1000));

    vi.advanceTimersByTime(999);
    // still pending
    expect(queue.getPending().map((e) => e.id)).toEqual(['a']);

    vi.advanceTimersByTime(1);
    await expect(promise).resolves.toBe('commit');
    expect(queue.getPending()).toEqual([]);
  });

  it('resolves with "cancel" when cancel() is called', async () => {
    const queue = new UndoableQueueService();
    const promise = queue.add(mk('b', 5000));

    queue.cancel('b');
    await expect(promise).resolves.toBe('cancel');
    expect(queue.getPending()).toEqual([]);
  });

  it('resolves with "commit" when commit() is called before the timer', async () => {
    const queue = new UndoableQueueService();
    const promise = queue.add(mk('c', 5000));

    queue.commit('c');
    await expect(promise).resolves.toBe('commit');
    expect(queue.getPending()).toEqual([]);
  });

  it('rejects on duplicate id', async () => {
    const queue = new UndoableQueueService();
    const first = queue.add(mk('d'));

    await expect(queue.add(mk('d'))).rejects.toThrow(/already pending/);
    // The first entry is still queued — clean it up so the timer
    // resolves and the test doesn't leak a pending promise.
    queue.commit('d');
    await first;
  });

  it('notifies subscribers on every state change', () => {
    const queue = new UndoableQueueService();
    const listener = vi.fn();
    const unsubscribe = queue.subscribe(listener);

    // initial snapshot on subscribe
    expect(listener).toHaveBeenLastCalledWith([]);

    void queue.add(mk('x'));
    void queue.add(mk('y'));
    queue.cancel('x');

    // 1 initial + 2 adds + 1 cancel
    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener.mock.lastCall?.[0].map((e: IUndoableMutation) => e.id)).toEqual(['y']);

    unsubscribe();

    queue.commit('y');
    // No further notifications after unsubscribe.
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('isolates a throwing listener from other listeners', () => {
    const queue = new UndoableQueueService();
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();

    queue.subscribe(bad);
    queue.subscribe(good);
    void queue.add(mk('z'));

    // good still called despite bad throwing
    expect(good).toHaveBeenCalled();
    // clean up
    queue.commit('z');
  });
});
