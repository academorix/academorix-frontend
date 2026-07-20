/**
 * @file deep-equal.util.test.ts
 * @description Unit tests for `deepEqual()` — the diff-suppression primitive
 *   underlying context sync (Req 12.3) and context-frame snapshot updates
 *   (Req 10.3).
 */

import { describe, expect, it } from 'vitest';

import { deepEqual } from '@/core/utils/deep-equal.util';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('returns true for equal primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('foo', 'foo')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('returns false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('foo', 'bar')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(0, '0')).toBe(false);
    });

    it('treats NaN as equal to NaN (Object.is semantics)', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
    });

    it('distinguishes +0 and -0 (Object.is semantics)', () => {
      expect(deepEqual(0, -0)).toBe(false);
      expect(deepEqual(+0, -0)).toBe(false);
    });
  });

  describe('arrays', () => {
    it('returns true for structurally equal arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([], [])).toBe(true);
    });

    it('returns false for arrays with different lengths', () => {
      expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
      expect(deepEqual([1], [])).toBe(false);
    });

    it('returns false for arrays with different elements', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('recurses into nested arrays', () => {
      expect(deepEqual([[1, [2]]], [[1, [2]]])).toBe(true);
      expect(deepEqual([[1, [2]]], [[1, [3]]])).toBe(false);
    });

    it('distinguishes array from plain object', () => {
      expect(deepEqual([1, 2], { 0: 1, 1: 2, length: 2 })).toBe(false);
    });
  });

  describe('objects', () => {
    it('returns true for structurally equal plain objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEqual({}, {})).toBe(true);
    });

    it('is order-insensitive across keys', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('returns false for objects with different key sets', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('returns false for objects with different values on the same key', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('recurses into nested objects', () => {
      const a = { user: { name: 'Ada', roles: ['admin'] } };
      const b = { user: { name: 'Ada', roles: ['admin'] } };
      const c = { user: { name: 'Ada', roles: ['user'] } };

      expect(deepEqual(a, b)).toBe(true);
      expect(deepEqual(a, c)).toBe(false);
    });
  });

  describe('mixed types', () => {
    it('returns false when one side is an object and the other a primitive', () => {
      expect(deepEqual({ a: 1 }, 1)).toBe(false);
      expect(deepEqual([1], 1)).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
    });
  });

  describe('symmetry (a≡b ⇔ b≡a)', () => {
    const cases: Array<[unknown, unknown]> = [
      [1, 1],
      [1, 2],
      [{ a: 1 }, { a: 1 }],
      [{ a: 1 }, { a: 2 }],
      [
        [1, 2],
        [1, 2],
      ],
      [{ a: [1] }, { a: [1, 2] }],
      [{ a: undefined }, { b: undefined }],
    ];

    for (const [a, b] of cases) {
      it(`is symmetric for ${JSON.stringify(a)} vs ${JSON.stringify(b)}`, () => {
        expect(deepEqual(a, b)).toBe(deepEqual(b, a));
      });
    }
  });
});
