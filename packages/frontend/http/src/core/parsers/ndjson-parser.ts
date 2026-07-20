/**
 * NDJSON parser.
 *
 * Decodes newline-delimited JSON streams. Each line is parsed
 * independently — malformed lines are skipped so a single bad row
 * doesn't kill the stream.
 *
 * @module @stackra/http/parsers/ndjson-parser
 */

import type { IStreamParser } from './stream-parser.interface';

/**
 * Newline-delimited JSON parser.
 *
 * @typeParam T - Decoded record type.
 */
export class NdjsonStreamParser<T = unknown> implements IStreamParser<T> {
  /** UTF-8 streaming decoder. */
  private readonly decoder: TextDecoder = new TextDecoder('utf-8', { fatal: false });

  /** Pending text awaiting a newline boundary. */
  private buffer: string = '';

  /** @inheritdoc */
  public *feed(chunk: Uint8Array): Iterable<T> {
    this.buffer += this.decoder.decode(chunk, { stream: true });

    // Split on \n — keep the trailing partial line in the buffer.
    let newlineIndex = this.buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, '');
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length > 0) {
        const parsed = NdjsonStreamParser.tryParse<T>(line);
        if (parsed !== undefined) yield parsed;
      }

      newlineIndex = this.buffer.indexOf('\n');
    }
  }

  /** @inheritdoc */
  public *flush(): Iterable<T> {
    // Decode any pending bytes inside the streaming decoder.
    this.buffer += this.decoder.decode(new Uint8Array(0));
    const tail = this.buffer;
    this.buffer = '';

    if (tail.length > 0) {
      const parsed = NdjsonStreamParser.tryParse<T>(tail);
      if (parsed !== undefined) yield parsed;
    }
  }

  /**
   * Best-effort `JSON.parse`. Returns `undefined` on syntax error so
   * one bad line cannot crash the stream.
   *
   * @param raw - Single NDJSON line.
   * @returns Parsed value, or `undefined` on error.
   */
  private static tryParse<T>(raw: string): T | undefined {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
}
