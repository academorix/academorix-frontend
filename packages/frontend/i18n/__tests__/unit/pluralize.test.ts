import { describe, it, expect } from 'vitest';
import { getPluralObject, selectPlural } from '@/core/utils/pluralize.util';

describe('getPluralObject', () => {
  it('detects plural objects with "one" and "other"', () => {
    const obj = { one: '1 item', other: '{{count}} items' };
    expect(getPluralObject(obj)).toBe(obj);
  });

  it('returns undefined for plain strings', () => {
    expect(getPluralObject('hello')).toBeUndefined();
  });

  it('returns undefined for arrays', () => {
    expect(getPluralObject(['a', 'b'])).toBeUndefined();
  });

  it('returns undefined for objects without plural keys', () => {
    expect(getPluralObject({ title: 'Hello', body: 'World' })).toBeUndefined();
  });
});

describe('selectPlural', () => {
  const plural = { zero: 'No items', one: '1 item', other: '{{count}} items' };

  it('selects zero form for count 0', () => {
    expect(selectPlural(plural, 0, 'en')).toBe('No items');
  });

  it('selects one form for count 1 (English)', () => {
    expect(selectPlural(plural, 1, 'en')).toBe('1 item');
  });

  it('selects other form for count > 1 (English)', () => {
    expect(selectPlural(plural, 5, 'en')).toBe('{{count}} items');
  });

  it('selects other form for count 0 when zero is not defined', () => {
    const noZero = { one: '1 item', other: '{{count}} items' };
    // In English, Intl.PluralRules(0) = "other"
    expect(selectPlural(noZero, 0, 'en')).toBe('{{count}} items');
  });
});
