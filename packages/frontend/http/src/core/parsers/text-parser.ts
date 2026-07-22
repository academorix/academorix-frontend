/**
 * @file text-parser.ts
 * Text parser.
 *
 * Decodes raw bytes as UTF-8 strings without buffering frames —
 * each chunk emits one string.
 *
 * @module @stackra/http/parsers/text-parser
 */

import type { IStreamParser } from "./stream-parser.interface";

/**
 * UTF-8 text parser.
 */
export class TextStreamParser implements IStreamParser<string> {
  /** Streaming UTF-8 decoder. */
  private readonly decoder: TextDecoder = new TextDecoder("utf-8", { fatal: false });

  /** @inheritdoc */
  public *feed(chunk: Uint8Array): Iterable<string> {
    const text = this.decoder.decode(chunk, { stream: true });
    if (text.length > 0) yield text;
  }

  /** @inheritdoc */
  public *flush(): Iterable<string> {
    const tail = this.decoder.decode(new Uint8Array(0));
    if (tail.length > 0) yield tail;
  }
}
