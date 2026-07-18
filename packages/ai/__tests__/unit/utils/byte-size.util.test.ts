/**
 * @file byte-size.util.test.ts
 * @description Unit tests for `serializedSizeOf()` — the context-frame size
 *   guard underlying Req 12.7 (per-frame + aggregate caps) and Req 12.8
 *   (truncate/omit + diagnostic on overflow).
 */

import { describe, expect, it } from 'vitest';

import { serializedSizeOf } from '@/core/utils/byte-size.util';

/** Local UTF-8 length helper for expected values. */
const encoder = new TextEncoder();
const bytesOf = (s: string): number => encoder.encode(s).byteLength;

describe('serializedSizeOf', () => {
  it('returns 0 for values that are not JSON-serializable', () => {
    // `JSON.stringify(undefined)` returns undefined; treat as zero bytes.
    expect(serializedSizeOf(undefined)).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(serializedSizeOf(() => {})).toBe(0);
  });

  it('measures a JSON string as its own UTF-8 byte length (with quotes)', () => {
    expect(serializedSizeOf('hello')).toBe(bytesOf('"hello"'));
    expect(serializedSizeOf('')).toBe(bytesOf('""'));
  });

  it('measures numbers, booleans, and null by their JSON literal', () => {
    expect(serializedSizeOf(42)).toBe(bytesOf('42'));
    expect(serializedSizeOf(true)).toBe(bytesOf('true'));
    expect(serializedSizeOf(false)).toBe(bytesOf('false'));
    expect(serializedSizeOf(null)).toBe(bytesOf('null'));
  });

  it('measures arrays and objects by their JSON.stringify representation', () => {
    const arr = [1, 2, 3];
    const obj = { a: 1, b: 'two' };

    expect(serializedSizeOf(arr)).toBe(bytesOf(JSON.stringify(arr)));
    expect(serializedSizeOf(obj)).toBe(bytesOf(JSON.stringify(obj)));
  });

  it('counts multi-byte UTF-8 characters correctly (emoji + non-ASCII)', () => {
    // A single emoji takes 4 bytes in UTF-8.
    const emojiValue = { title: 'AI 🤖' };
    expect(serializedSizeOf(emojiValue)).toBe(bytesOf(JSON.stringify(emojiValue)));

    // Sanity: a 4-byte emoji plus the surrounding ASCII string quotes.
    const emojiOnly = '🤖';
    expect(serializedSizeOf(emojiOnly)).toBe(bytesOf('"🤖"'));
  });

  it('reflects the size of a truncated payload accurately', () => {
    const big = { snapshot: 'x'.repeat(1000) };
    const size = serializedSizeOf(big);
    // 1000 chars of "x" + 4 chars of JSON overhead (quotes + key + colon + brace).
    expect(size).toBeGreaterThan(1000);
  });
});
