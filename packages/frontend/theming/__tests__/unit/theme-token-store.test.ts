/**
 * @file theme-token-store.test.ts
 * @module @stackra/theming/test
 * @description Unit tests for ThemeTokenStore.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeTokenStore } from '@/core/stores';

describe('ThemeTokenStore', () => {
  let store: ThemeTokenStore;

  beforeEach(() => {
    store = new ThemeTokenStore();
  });

  it('should have default state', () => {
    const state = store.getState();
    expect(state.themeId).toBe('default');
    expect(state.mode).toBe('system');
    expect(state.resolvedMode).toBe('light');
    expect(state.registryRevision).toBe(0);
  });

  it('should initialize with custom defaults', () => {
    store.initialize('sky', 'dark');
    const state = store.getState();
    expect(state.themeId).toBe('sky');
    expect(state.mode).toBe('dark');
  });

  it('should update state partially', () => {
    store.setState({ themeId: 'mint', resolvedMode: 'dark' });
    const state = store.getState();
    expect(state.themeId).toBe('mint');
    expect(state.resolvedMode).toBe('dark');
    expect(state.mode).toBe('system'); // unchanged
  });

  it('should notify subscribers on setState', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState({ themeId: 'lavender' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'lavender' }));
  });

  it('should unsubscribe correctly', () => {
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.setState({ themeId: 'x' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should increment revision', () => {
    expect(store.getState().registryRevision).toBe(0);
    store.incrementRevision();
    expect(store.getState().registryRevision).toBe(1);
    store.incrementRevision();
    expect(store.getState().registryRevision).toBe(2);
  });
});
