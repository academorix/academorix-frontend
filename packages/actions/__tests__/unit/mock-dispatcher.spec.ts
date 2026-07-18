/**
 * @file mock-dispatcher.spec.ts
 * @description Unit tests for the mock dispatcher + assertions.
 */

import { describe, expect, it } from 'vitest';
import { assertActionDispatched, createMockDispatcher } from '@/testing';

describe('createMockDispatcher', () => {
  it('records dispatched calls', async () => {
    const mock = createMockDispatcher();
    mock.register({ kind: 'toast', execute: () => ({ success: true }) });

    await mock.dispatch({ kind: 'toast', message: 'Hi' } as never);
    await mock.dispatch({ kind: 'toast', message: 'Bye' } as never);

    expect(mock.calls).toHaveLength(2);
    assertActionDispatched(mock, 'toast').times(2);
    assertActionDispatched(mock, 'toast').withPayload({ kind: 'toast', message: 'Hi' }).times(1);
  });

  it('returns success:false when no handler is registered', async () => {
    const mock = createMockDispatcher();
    const response = await mock.dispatch({ kind: 'unknown' } as never);
    expect(response.success).toBe(false);
    expect(response.message).toMatch(/No handler registered/);
  });

  it('short-circuits on aborted signal', async () => {
    const mock = createMockDispatcher();
    mock.register({ kind: 'toast', execute: () => ({ success: true }) });
    const ctrl = new AbortController();
    ctrl.abort();
    const response = await mock.dispatch({ kind: 'toast' } as never, { signal: ctrl.signal });
    expect(response).toEqual({ success: false, message: 'Aborted' });
  });
});
