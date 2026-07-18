// @vitest-environment jsdom
/**
 * @file use-action-press.spec.tsx
 * @module @stackra/actions/__tests__/unit
 * @description Behavioural tests for {@link useActionPress} — verifies
 *   the returned `onPress` handler dispatches the bound descriptor +
 *   surfaces the pending state from the underlying `useAction`.
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IActionDescriptor, IActionResponse } from '@stackra/contracts';

import { useActionPress } from '@/core/hooks/use-action-press';

const { mockDispatch, setDispatch } = vi.hoisted(() => {
  let impl: (d: IActionDescriptor, ctx?: unknown) => Promise<IActionResponse> = async () => ({
    success: true,
  });
  return {
    mockDispatch: vi.fn((descriptor: IActionDescriptor, ctx?: unknown) => impl(descriptor, ctx)),
    setDispatch: (next: (d: IActionDescriptor, ctx?: unknown) => Promise<IActionResponse>) => {
      impl = next;
    },
  };
});

vi.mock('@stackra/container/react', () => ({
  useInject: () => ({ dispatch: mockDispatch }),
}));

afterEach(() => {
  cleanup();
  mockDispatch.mockClear();
  setDispatch(async () => ({ success: true }));
});

describe('useActionPress', () => {
  it('dispatches the bound descriptor when onPress fires', async () => {
    const descriptor: IActionDescriptor = { kind: 'toast' };
    const { result } = renderHook(() => useActionPress(descriptor));

    await act(async () => {
      await result.current.onPress();
    });

    expect(mockDispatch).toHaveBeenCalledOnce();
    expect(mockDispatch.mock.calls[0]?.[0]).toEqual(descriptor);
  });

  it('forwards caller context to the dispatcher', async () => {
    const descriptor: IActionDescriptor = { kind: 'toast' };
    const context = { record: { id: 7 } };
    const { result } = renderHook(() => useActionPress(descriptor, { context }));

    await act(async () => {
      await result.current.onPress();
    });

    expect(mockDispatch.mock.calls[0]?.[1]).toEqual(context);
  });

  it('invokes onDone with the response + descriptor after each press', async () => {
    setDispatch(async () => ({ success: true, data: 'ok' }));
    const descriptor: IActionDescriptor = { kind: 'toast' };
    const onDone = vi.fn();
    const { result } = renderHook(() => useActionPress(descriptor, { onDone }));

    await act(async () => {
      await result.current.onPress();
    });

    expect(onDone).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledWith({ success: true, data: 'ok' }, descriptor);
  });

  it('propagates the underlying pending + error state', async () => {
    setDispatch(async () => ({ success: false, message: 'denied' }));
    const { result } = renderHook(() => useActionPress({ kind: 'toast' }));

    await act(async () => {
      await result.current.onPress();
    });

    expect(result.current.error).toBe('denied');
    expect(result.current.isPending).toBe(false);
  });
});
