// @vitest-environment jsdom
/**
 * @file use-devtools-shortcut.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests `useDevtoolsShortcut` — the global-keydown
 *   binding that fires when the configured combo is pressed.
 */

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDevtoolsShortcut } from '@/react/hooks/use-devtools-shortcut.hook';

afterEach(() => {
  cleanup();
});

/**
 * Dispatch a `keydown` on `window` matching the shortcut fields.
 */
function fireKey(fields: Partial<KeyboardEvent> & { readonly key: string }): boolean {
  const event = new KeyboardEvent('keydown', {
    key: fields.key,
    ctrlKey: fields.ctrlKey ?? false,
    metaKey: fields.metaKey ?? false,
    altKey: fields.altKey ?? false,
    shiftKey: fields.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  return window.dispatchEvent(event);
}

describe('useDevtoolsShortcut', () => {
  it('fires the callback when the exact combo matches', () => {
    const onFire = vi.fn();
    renderHook(() => useDevtoolsShortcut({ meta: true, shift: true, key: 'd' }, onFire));
    fireKey({ key: 'd', metaKey: true, shiftKey: true });
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('does not fire when modifiers differ', () => {
    const onFire = vi.fn();
    renderHook(() => useDevtoolsShortcut({ meta: true, shift: true, key: 'd' }, onFire));
    // Meta missing.
    fireKey({ key: 'd', shiftKey: true });
    // Shift missing.
    fireKey({ key: 'd', metaKey: true });
    // Extra modifier.
    fireKey({ key: 'd', metaKey: true, shiftKey: true, altKey: true });
    expect(onFire).not.toHaveBeenCalled();
  });

  it('does not fire when the key differs', () => {
    const onFire = vi.fn();
    renderHook(() => useDevtoolsShortcut({ meta: true, key: 'd' }, onFire));
    fireKey({ key: 'e', metaKey: true });
    expect(onFire).not.toHaveBeenCalled();
  });

  it('is case-insensitive on key', () => {
    const onFire = vi.fn();
    renderHook(() => useDevtoolsShortcut({ meta: true, key: 'D' }, onFire));
    fireKey({ key: 'd', metaKey: true });
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the shortcut is false', () => {
    const onFire = vi.fn();
    renderHook(() => useDevtoolsShortcut(false, onFire));
    fireKey({ key: 'd', metaKey: true, shiftKey: true });
    expect(onFire).not.toHaveBeenCalled();
  });

  it('unbinds on unmount', () => {
    const onFire = vi.fn();
    const { unmount } = renderHook(() => useDevtoolsShortcut({ meta: true, key: 'd' }, onFire));
    unmount();
    fireKey({ key: 'd', metaKey: true });
    expect(onFire).not.toHaveBeenCalled();
  });
});
