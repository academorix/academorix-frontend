/**
 * @file url-b64-to-uint8array.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Tests for the {@link urlB64ToUint8Array} helper —
 *   padding, URL-safe alphabet, RFC-4648.
 */

import { describe, expect, it } from 'vitest';

import { urlB64ToUint8Array } from '@/push';

describe('urlB64ToUint8Array', () => {
  it('decodes an already-padded base64 string', () => {
    // "SGVsbG8=" decodes to "Hello" (5 bytes: 72 101 108 108 111).
    const result = urlB64ToUint8Array('SGVsbG8=');
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it('pads an unpadded input to a multiple of four characters', () => {
    // "SGVsbG8" (no padding) still decodes to "Hello".
    const result = urlB64ToUint8Array('SGVsbG8');
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it('accepts URL-safe alphabet (`-` and `_`)', () => {
    // Standard base64: "P/A+" decodes to bytes [63 240 62].
    // URL-safe equivalent: "P_A-" — same bytes.
    const standard = urlB64ToUint8Array('P/A+');
    const urlSafe = urlB64ToUint8Array('P_A-');
    expect(Array.from(urlSafe)).toEqual(Array.from(standard));
  });

  it('produces an empty array for an empty input', () => {
    const result = urlB64ToUint8Array('');
    expect(result).toEqual(new Uint8Array([]));
  });

  it('handles a canonical VAPID-shaped key round-trip', () => {
    // 65 bytes of pseudo-random content — the length of a real
    // VAPID public key. We reconstruct the exact byte sequence to
    // prove the decoder is stable.
    const bytes = new Uint8Array(65);
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 7) & 0xff;
    // Encode to URL-safe base64 without padding.
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i] as number);
    // support-utilities-exempt: character-class regex is a language feature; Str.replace only handles literals.
    const encoded = btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const decoded = urlB64ToUint8Array(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});
