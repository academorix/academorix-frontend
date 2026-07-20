/**
 * @file backoff.util.test.ts
 * @description Unit tests for `computeBackoff()` — the deterministic
 *   bounded-exponential backoff used by the ConnectionManager (Req 24.3).
 *   The property test (Property 11) travels with the ConnectionManager in
 *   task 4.
 */

import { describe, expect, it } from 'vitest';

import { computeBackoff, type IBackoffPolicy } from '@/core/utils/backoff.util';

const policy: IBackoffPolicy = { baseMs: 500, capMs: 15_000 };

describe('computeBackoff (deterministic)', () => {
  it('returns baseMs on the first (0-indexed) attempt', () => {
    expect(computeBackoff(0, policy)).toBe(500);
  });

  it('doubles each attempt until it reaches the cap', () => {
    expect(computeBackoff(1, policy)).toBe(1000);
    expect(computeBackoff(2, policy)).toBe(2000);
    expect(computeBackoff(3, policy)).toBe(4000);
    expect(computeBackoff(4, policy)).toBe(8000);
  });

  it('never exceeds capMs', () => {
    for (let attempt = 5; attempt <= 100; attempt++) {
      expect(computeBackoff(attempt, policy)).toBeLessThanOrEqual(policy.capMs);
    }
  });

  it('clamps negative and non-finite attempts to zero', () => {
    expect(computeBackoff(-1, policy)).toBe(policy.baseMs);
    expect(computeBackoff(Number.NaN, policy)).toBe(policy.baseMs);
  });

  it('floors fractional attempts', () => {
    expect(computeBackoff(1.7, policy)).toBe(1000); // = baseMs * 2^1
  });
});

describe('computeBackoff (jittered)', () => {
  it('uses the injected random source when jitter is enabled', () => {
    // Fixed random source returns 0.5, so the jittered delay = 0.5 * bounded.
    const random = (): number => 0.5;
    expect(computeBackoff(0, policy, { jitter: true, random })).toBe(250);
    expect(computeBackoff(1, policy, { jitter: true, random })).toBe(500);
    // Capped attempts stay capped even with jitter.
    expect(computeBackoff(30, policy, { jitter: true, random })).toBe(policy.capMs / 2);
  });

  it('respects the cap under any jitter sample (0..1]', () => {
    const samples = [0, 0.25, 0.5, 0.75, 0.999];
    for (const sample of samples) {
      const delay = computeBackoff(20, policy, { jitter: true, random: () => sample });
      expect(delay).toBeLessThanOrEqual(policy.capMs);
    }
  });
});
