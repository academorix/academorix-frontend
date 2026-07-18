/**
 * @file testing-mocks.test.ts
 * @module @stackra/analytics/__tests__/unit
 * @description Verifies that `@stackra/analytics/testing`'s
 *   `MockAnalyticsManager` still implements the current public
 *   `IAnalyticsManager` shape.
 */

import { describe, it, expect } from 'vitest';
import type { IAnalyticsManager, IAnalyticsProvider } from '@stackra/contracts';

// Import from the source (the package testing barrel is dist-compiled at
// publish; hitting src keeps the loop fast in the monorepo).
import { MockAnalyticsManager, createMockAnalyticsManager } from '@/testing';

describe('MockAnalyticsManager', () => {
  it('records track / page / identify / reset', () => {
    const mock = createMockAnalyticsManager();
    mock.track('signup', { plan: 'pro' });
    mock.page({ path: '/dashboard' });
    mock.identify('user-1', { plan: 'pro' });
    mock.reset();

    expect(mock.calls).toEqual([
      { kind: 'track', name: 'signup', properties: { plan: 'pro' } },
      { kind: 'page', view: { path: '/dashboard' } },
      { kind: 'identify', userId: 'user-1', traits: { plan: 'pro' } },
      { kind: 'reset' },
    ]);
  });

  it('register() appends to getProviders()', () => {
    const mock = new MockAnalyticsManager();
    const provider: IAnalyticsProvider = {
      name: 'test',
      track: () => {},
    };
    mock.register(provider);
    expect(mock.getProviders()).toEqual([provider]);
  });

  it('conforms to IAnalyticsManager', () => {
    // Structural check — assign to the interface type.
    const mock: IAnalyticsManager = createMockAnalyticsManager();
    expect(typeof mock.track).toBe('function');
    expect(typeof mock.page).toBe('function');
    expect(typeof mock.identify).toBe('function');
    expect(typeof mock.reset).toBe('function');
    expect(typeof mock.register).toBe('function');
    expect(typeof mock.getProviders).toBe('function');
  });
});
