/**
 * @file prefix-key.spec.ts
 * @module @stackra/storage/test/unit
 * @description The `prefixKey` / `stripPrefix` helpers namespace
 *   keys for stores that share a backing DOM `Storage` — validate
 *   both directions round-trip.
 */

import { describe, it, expect } from 'vitest';

import { prefixKey, stripPrefix } from '@/core/utils/prefix-key.util';

describe('prefixKey', () => {
  it('returns the raw key when prefix is empty', () => {
    expect(prefixKey('', 'theme')).toBe('theme');
  });

  it('prepends `${prefix}:` to the key', () => {
    expect(prefixKey('app:prefs', 'theme')).toBe('app:prefs:theme');
  });
});

describe('stripPrefix', () => {
  it('returns the raw key when prefix is empty', () => {
    expect(stripPrefix('', 'theme')).toBe('theme');
  });

  it('strips the prefix from a matching key', () => {
    expect(stripPrefix('app:prefs', 'app:prefs:theme')).toBe('theme');
  });

  it('returns null for a key not under the prefix', () => {
    expect(stripPrefix('app:prefs', 'other:theme')).toBeNull();
    expect(stripPrefix('app:prefs', 'app:prefstheme')).toBeNull();
  });
});
