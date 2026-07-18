// @vitest-environment jsdom
/**
 * @file use-action-selection.spec.tsx
 * @module @stackra/actions/__tests__/unit
 * @description Behavioural tests for {@link useActionSelection} —
 *   verifies HeroUI-style selection (`'all' | Set<Key>`) is threaded
 *   into the mapper and the resulting descriptor is dispatched.
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IActionDescriptor, IActionResponse } from '@stackra/contracts';

import { useActionSelection } from '@/core/hooks/use-action-selection';

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

interface ISetStateAction extends IActionDescriptor<'setState'> {
  readonly value: unknown;
}

describe('useActionSelection', () => {
  it('threads a single-key selection through the mapper', async () => {
    const base: ISetStateAction = { kind: 'setState', value: null };
    const { result } = renderHook(() =>
      useActionSelection<string, ISetStateAction>(base, (sel, b) => {
        // Collapse the selection to its first key — mimics the shape
        // caller code typically wants for a "pick one" widget.
        const value = sel === 'all' ? '*' : ([...sel][0] ?? null);
        return { ...b, value };
      })
    );

    await act(async () => {
      await result.current.onSelectionChange(new Set(['us']));
    });

    expect(mockDispatch.mock.calls[0]?.[0]).toEqual({
      kind: 'setState',
      value: 'us',
    });
  });

  it('threads the `all` sentinel through the mapper', async () => {
    const base: ISetStateAction = { kind: 'setState', value: null };
    const { result } = renderHook(() =>
      useActionSelection<string, ISetStateAction>(base, (sel, b) => ({
        ...b,
        value: sel === 'all' ? 'ALL' : 'SOME',
      }))
    );

    await act(async () => {
      await result.current.onSelectionChange('all');
    });

    expect(mockDispatch.mock.calls[0]?.[0]).toEqual({ kind: 'setState', value: 'ALL' });
  });
});
