/**
 * @file mock-devtools-panels-registry.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Verifies the testing-subpath mock behaves like the
 *   production registry.
 */

// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  createMockDevtoolsPanel,
  createMockDevtoolsRegistry,
  MockDevtoolsPanelsRegistry,
} from '@/testing';

describe('MockDevtoolsPanelsRegistry', () => {
  it('is last-wins per id', () => {
    const registry = new MockDevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a', title: 'One' }));
    registry.register(createMockDevtoolsPanel({ id: 'a', title: 'Two' }));
    expect(registry.size).toBe(1);
    expect(registry.find('a')?.title).toBe('Two');
  });

  it('reset() drops every panel', () => {
    const registry = new MockDevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a' }));
    registry.reset();
    expect(registry.size).toBe(0);
  });
});

describe('createMockDevtoolsRegistry', () => {
  it('records register calls via the assertable proxy', () => {
    const registry = createMockDevtoolsRegistry();
    const panel = createMockDevtoolsPanel({ id: 'a' });
    registry.register(panel);
    // AssertableProxy exposes `.$` with `wasCalledWith`.
    expect(registry.$.wasCalledWith('register', panel)).toBe(true);
  });
});
