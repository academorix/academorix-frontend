// @vitest-environment jsdom
/**
 * @file use-action.spec.tsx
 * @module @stackra/actions/__tests__/unit
 * @description Behavioural tests for {@link useAction} — verifies the
 *   reactive state machine (pending, response, data, error), stale-
 *   response suppression via the generation counter, `reset()`, and
 *   mount-safety.
 */

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IActionDescriptor, IActionResponse } from '@stackra/contracts';

import { useAction } from '@/core/hooks/use-action';

/**
 * Replace `@stackra/container/react` with a hoisted mock that lets each
 * test control what `useInject(ACTION_DISPATCHER)` returns. `vi.hoisted`
 * defines the state before the mock factory runs.
 */
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

describe('useAction', () => {
  it('starts with the initial state', () => {
    const { result } = renderHook(() => useAction('toast'));
    expect(result.current.isPending).toBe(false);
    expect(result.current.response).toBeNull();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets isPending during run and clears it on resolve with success', async () => {
    setDispatch(async () => ({ success: true, data: 42 }));
    const { result } = renderHook(() => useAction<IActionDescriptor, number>('toast'));

    let pending: Promise<IActionResponse<number>>;
    act(() => {
      pending = result.current.run({ kind: 'toast' });
    });
    // The synchronous `setState` from `run()` marks pending immediately.
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      await pending;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.response).toEqual({ success: true, data: 42 });
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it('surfaces failure as `error` and null data', async () => {
    setDispatch(async () => ({ success: false, message: 'nope' }));
    const { result } = renderHook(() => useAction('toast'));

    await act(async () => {
      await result.current.run({ kind: 'toast' });
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe('nope');
    expect(result.current.data).toBeNull();
    expect(result.current.response).toEqual({ success: false, message: 'nope' });
  });

  it("returns the dispatcher's response from run()", async () => {
    setDispatch(async () => ({ success: true, data: 'ok' }));
    const { result } = renderHook(() => useAction<IActionDescriptor, string>('toast'));

    const returned = await act(async () => result.current.run({ kind: 'toast' }));
    expect(returned).toEqual({ success: true, data: 'ok' });
  });

  it('reset() clears state back to initial', async () => {
    setDispatch(async () => ({ success: true, data: 1 }));
    const { result } = renderHook(() => useAction('toast'));

    await act(async () => {
      await result.current.run({ kind: 'toast' });
    });
    expect(result.current.data).toBe(1);

    act(() => result.current.reset());

    expect(result.current.isPending).toBe(false);
    expect(result.current.response).toBeNull();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('suppresses a stale in-flight run when a fresher run supersedes it', async () => {
    // Slow first dispatch resolves AFTER a faster second one; only the
    // fresher generation should commit terminal state.
    let resolveFirst: (r: IActionResponse) => void = () => undefined;
    setDispatch(
      () =>
        new Promise<IActionResponse>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const { result } = renderHook(() => useAction<IActionDescriptor, string>('toast'));

    // First run — held pending.
    let first: Promise<IActionResponse<string>>;
    act(() => {
      first = result.current.run({ kind: 'toast' });
    });

    // Second, faster run — resolves synchronously with different data.
    setDispatch(async () => ({ success: true, data: 'second' }));
    await act(async () => {
      await result.current.run({ kind: 'toast' });
    });

    expect(result.current.data).toBe('second');

    // Now unblock the first dispatch — its terminal state must be
    // ignored because it's a stale generation.
    resolveFirst({ success: true, data: 'first' });
    await first!;

    expect(result.current.data).toBe('second');
  });

  it('does not write state after unmount', async () => {
    // If the guard is broken, React logs a "state update on unmounted"
    // warning. Fail fast by watching console.error.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let resolve: (r: IActionResponse) => void = () => undefined;
    setDispatch(() => new Promise((r) => (resolve = r)));

    const { result, unmount } = renderHook(() => useAction('toast'));
    let inFlight: Promise<IActionResponse>;
    act(() => {
      inFlight = result.current.run({ kind: 'toast' });
    });

    unmount();
    resolve({ success: true });
    await inFlight!;

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
