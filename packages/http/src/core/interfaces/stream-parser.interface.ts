/**
 * @file stream-parser.interface.ts
 * @module @stackra/http/src/interfaces
 * @description IStreamParser interface.
 */

/**
 * Stream parser contract — internal-only, hence local with `I` prefix.
 *
 * @typeParam T - Decoded value type.
 */
export interface IStreamParser<T = unknown> {
  /**
   * Feed one chunk and yield every complete value the chunk
   * unblocks. Implementations buffer partial frames between calls.
   *
   * @param chunk - Bytes from the connector.
   * @returns Iterable of decoded values (may be empty).
   */
  feed(chunk: Uint8Array): Iterable<T>;

  /**
   * Flush any final value the parser holds at end-of-stream. Most
   * parsers return an empty iterable; line-delimited parsers may
   * yield the trailing line.
   */
  flush(): Iterable<T>;
}
