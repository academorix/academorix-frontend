/**
 * @file base64.util.ts
 * @module @stackra/ai/core/utils
 * @description Cross-platform base64 encode/decode for the speech APIs
 *   (`transcribe`, `synthesize`). Uses `Buffer` on Node and the browser's
 *   `atob`/`btoa` on the web.
 */

/**
 * Encode a byte view to a base64 string.
 *
 * @param bytes - The bytes to encode.
 * @returns The base64 representation.
 */
export function base64Encode(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer.from(view).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]!);
  // eslint-disable-next-line no-restricted-globals
  return globalThis.btoa(binary);
}

/**
 * Decode a base64 string to an ArrayBuffer.
 *
 * @param b64 - The base64 string.
 * @returns The decoded bytes as an ArrayBuffer.
 */
export function base64Decode(b64: string): ArrayBuffer {
  if (typeof globalThis.Buffer !== 'undefined') {
    const buf = globalThis.Buffer.from(b64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  // eslint-disable-next-line no-restricted-globals
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
