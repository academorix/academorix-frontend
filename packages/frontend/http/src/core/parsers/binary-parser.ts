/**
 * @file binary-parser.ts
 * Binary passthrough parser.
 *
 * Yields each chunk untouched. Useful for binary streams (audio,
 * image bytes, custom protocols) where the consumer wants raw
 * `Uint8Array` chunks.
 *
 * @module @stackra/http/parsers/binary-parser
 */

import type { IStreamParser } from "./stream-parser.interface";

/**
 * Binary passthrough parser.
 */
export class BinaryStreamParser implements IStreamParser<Uint8Array> {
  /** @inheritdoc */
  public *feed(chunk: Uint8Array): Iterable<Uint8Array> {
    yield chunk;
  }

  /** @inheritdoc */
  public *flush(): Iterable<Uint8Array> {
    // No buffering — flush is a no-op.
  }
}
