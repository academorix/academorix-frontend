/**
 * @file csp-registry.test.ts
 * @module @stackra/csp/__tests__/unit
 * @description CspRegistry — register + merge (de-duped).
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { CspRegistry } from '@/core/registries/csp.registry';

describe('CspRegistry', () => {
  let registry: CspRegistry;

  beforeEach(() => {
    registry = new CspRegistry();
  });

  it('registers a policy and exposes its name', () => {
    registry.registerPolicy({ name: 'tracking', scriptSrc: ['https://gtm.example.com'] });
    expect(registry.getNames()).toContain('tracking');
    expect(registry.getAll()).toHaveLength(1);
  });

  it('ignores policies registered under an empty name', () => {
    registry.register('', { name: '', scriptSrc: ['https://x.example.com'] });
    expect(registry.getNames()).toHaveLength(0);
  });

  it('merges sources across policies and de-dupes', () => {
    registry.registerPolicy({ name: 'a', scriptSrc: ['https://cdn.example.com'] });
    registry.registerPolicy({
      name: 'b',
      scriptSrc: ['https://cdn.example.com', 'https://js.stripe.com'],
      frameSrc: ['https://hooks.stripe.com'],
    });

    const merged = registry.merge();
    expect(merged.scriptSrc).toEqual(['https://cdn.example.com', 'https://js.stripe.com']);
    expect(merged.frameSrc).toEqual(['https://hooks.stripe.com']);
  });

  it('replaces an existing policy registered under the same name', () => {
    registry.registerPolicy({ name: 'dup', scriptSrc: ['https://one.example.com'] });
    registry.registerPolicy({ name: 'dup', scriptSrc: ['https://two.example.com'] });

    expect(registry.getAll()).toHaveLength(1);
    expect(registry.merge().scriptSrc).toEqual(['https://two.example.com']);
  });
});
