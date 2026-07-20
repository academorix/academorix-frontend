/**
 * @file composite-handler.spec.ts
 * @description Unit tests for {@link CompositeHandler}.
 */

import { describe, expect, it } from 'vitest';
import { ActionKind, type ICompositeAction } from '@stackra/contracts';
import { CompositeHandler } from '@/core/handlers/composite.handler';
import { createMockDispatcher } from '@/testing/create-mock-dispatcher';

describe('CompositeHandler', () => {
  it('runs each descriptor sequentially and returns the last response', async () => {
    const dispatcher = createMockDispatcher();
    dispatcher.register({ kind: 'a', execute: () => ({ success: true, data: 'a' }) });
    dispatcher.register({ kind: 'b', execute: () => ({ success: true, data: 'b' }) });
    const handler = new CompositeHandler(dispatcher);

    const descriptor: ICompositeAction = {
      kind: ActionKind.Composite,
      actions: [{ kind: 'a' }, { kind: 'b' }],
    };

    const response = await handler.execute(descriptor, {});
    expect(response).toEqual({ success: true, data: 'b' });
    expect(dispatcher.calls.map((c) => c.descriptor.kind)).toEqual(['a', 'b']);
  });

  it('short-circuits on first failure by default', async () => {
    const dispatcher = createMockDispatcher();
    dispatcher.register({ kind: 'a', execute: () => ({ success: false, message: 'nope' }) });
    dispatcher.register({ kind: 'b', execute: () => ({ success: true }) });
    const handler = new CompositeHandler(dispatcher);

    const response = await handler.execute(
      { kind: ActionKind.Composite, actions: [{ kind: 'a' }, { kind: 'b' }] },
      {}
    );
    expect(response.success).toBe(false);
    expect(dispatcher.calls.map((c) => c.descriptor.kind)).toEqual(['a']);
  });

  it('continues past failures when stopOnFailure: false', async () => {
    const dispatcher = createMockDispatcher();
    dispatcher.register({ kind: 'a', execute: () => ({ success: false, message: 'nope' }) });
    dispatcher.register({ kind: 'b', execute: () => ({ success: true, data: 'b' }) });
    const handler = new CompositeHandler(dispatcher);

    const response = await handler.execute(
      { kind: ActionKind.Composite, stopOnFailure: false, actions: [{ kind: 'a' }, { kind: 'b' }] },
      {}
    );
    expect(response).toEqual({ success: true, data: 'b' });
    expect(dispatcher.calls.map((c) => c.descriptor.kind)).toEqual(['a', 'b']);
  });
});
