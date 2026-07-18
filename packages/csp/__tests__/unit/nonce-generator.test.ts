/**
 * @file nonce-generator.test.ts
 * @module @stackra/csp/__tests__/unit
 * @description NonceGenerator — produces unique, non-empty nonces.
 */

import { describe, it, expect } from 'vitest';

import { NonceGenerator } from '@/core/services/nonce-generator.service';

describe('NonceGenerator', () => {
  const generator = new NonceGenerator();

  it('generates a non-empty nonce', () => {
    const nonce = generator.generate();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('generates a unique nonce on each call', () => {
    const a = generator.generate();
    const b = generator.generate();
    expect(a).not.toBe(b);
  });

  it('strips dashes from the generated value', () => {
    expect(generator.generate()).not.toContain('-');
  });
});
