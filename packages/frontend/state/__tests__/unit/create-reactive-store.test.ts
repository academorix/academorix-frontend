/**
 * @file create-reactive-store.test.ts
 * @module @stackra/state/__tests__
 * @description Verifies the auto-event-emitting store wrapper.
 */

import { describe, it, expect, vi } from 'vitest';
import { createReactiveStore } from '@/core/utils/create-reactive-store.util';
import { STATE_EVENTS } from '@stackra/contracts';

describe('createReactiveStore', () => {
  it('creates a store with the given initial state', () => {
    const store = createReactiveStore('theme', { mode: 'system' });
    expect(store.state).toEqual({ mode: 'system' });
  });

  it('emits "{name}.changed" with a diff on mutation', () => {
    const emit = vi.fn();
    const emitter = { emit, on: vi.fn(), off: vi.fn() } as never;

    const store = createReactiveStore('theme', { mode: 'system' }, emitter);
    store.setState((s) => ({ ...s, mode: 'dark' }));

    expect(emit).toHaveBeenCalledWith(
      `theme.${STATE_EVENTS.CHANGED}`,
      expect.objectContaining({
        name: 'theme',
        state: { mode: 'dark' },
        changed: ['mode'],
        previous: { mode: 'system' },
      })
    );
  });

  it('does not emit when nothing changed', () => {
    const emit = vi.fn();
    const emitter = { emit, on: vi.fn(), off: vi.fn() } as never;

    const store = createReactiveStore('theme', { mode: 'system' }, emitter);
    store.setState((s) => ({ ...s }));

    expect(emit).not.toHaveBeenCalled();
  });

  it('is a no-op emitter when none is provided', () => {
    const store = createReactiveStore('theme', { mode: 'system' });
    expect(() => store.setState((s) => ({ ...s, mode: 'dark' }))).not.toThrow();
    expect(store.state).toEqual({ mode: 'dark' });
  });
});
