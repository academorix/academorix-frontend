/**
 * @file merge-config.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Tests for the notifications `mergeConfig` — defaults
 *   are applied, user overrides win, `push` block is preserved
 *   verbatim.
 */

import { describe, expect, it } from 'vitest';

import { DEFAULT_NOTIFICATIONS_CONFIG, mergeConfig } from '@/core';

describe('mergeConfig — defaults', () => {
  it('returns the default config when called without arguments', () => {
    const merged = mergeConfig();
    expect(merged.centre?.storage).toBe(DEFAULT_NOTIFICATIONS_CONFIG.centre?.storage);
    expect(merged.centre?.storageKey).toBe(DEFAULT_NOTIFICATIONS_CONFIG.centre?.storageKey);
    expect(merged.centre?.maxItems).toBe(DEFAULT_NOTIFICATIONS_CONFIG.centre?.maxItems);
    expect(merged.defaultStack).toEqual(DEFAULT_NOTIFICATIONS_CONFIG.defaultStack);
    expect('push' in merged).toBe(false);
  });

  it('leaves push absent when the caller omits it', () => {
    const merged = mergeConfig({ centre: { storage: 'localStorage' } });
    expect(merged.push).toBeUndefined();
  });
});

describe('mergeConfig — one-level-deep centre merge', () => {
  it('preserves sibling defaults when only one centre field is overridden', () => {
    const merged = mergeConfig({ centre: { maxItems: 500 } });
    expect(merged.centre?.maxItems).toBe(500);
    // Sibling defaults must survive the partial override.
    expect(merged.centre?.storageKey).toBe(DEFAULT_NOTIFICATIONS_CONFIG.centre?.storageKey);
    expect(merged.centre?.storage).toBe(DEFAULT_NOTIFICATIONS_CONFIG.centre?.storage);
  });

  it('honours a full centre override', () => {
    const merged = mergeConfig({
      centre: { storage: 'localStorage', storageKey: 'custom', maxItems: 42 },
    });
    expect(merged.centre?.storage).toBe('localStorage');
    expect(merged.centre?.storageKey).toBe('custom');
    expect(merged.centre?.maxItems).toBe(42);
  });
});

describe('mergeConfig — push passthrough', () => {
  it('preserves the caller-supplied push block verbatim', () => {
    const push = {
      vapidPublicKey: 'BAo0',
      serviceWorkerScope: '/notifications',
      userVisibleOnly: false,
    } as const;
    const merged = mergeConfig({ push });
    expect(merged.push).toEqual(push);
  });
});

describe('mergeConfig — defaultStack override', () => {
  it('honours a fully-custom default stack', () => {
    const merged = mergeConfig({ defaultStack: ['in-app', 'email'] });
    expect(merged.defaultStack).toEqual(['in-app', 'email']);
  });
});
