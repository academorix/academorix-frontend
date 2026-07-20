/**
 * JSON streaming parser.
 *
 * Parses a stream that emits one or more complete JSON values
 * sequentially (e.g. `{...}{...}{...}`). Maintains a depth counter
 * outside of strings to detect when a top-level value finishes.
 *
 * @module @stackra/http/parsers/json-stream-parser
 */

import type { IStreamParser } from "./stream-parser.interface";

/**
 * Naive but production-safe streaming JSON parser. Emits each
 * top-level value as it completes.
 *
 * @typeParam T - Decoded value type.
 */
export class JsonStreamParser<T = unknown> implements IStreamParser<T> {
  /** UTF-8 streaming decoder. */
  private readonly decoder: TextDecoder = new TextDecoder("utf-8", { fatal: false });

  /** Pending text accumulated across chunks. */
  private buffer: string = "";

  /** Current bracket depth — `0` between values. */
  private depth: number = 0;

  /** Whether the cursor is currently inside a string literal. */
  private inString: boolean = false;

  /** Whether the previous character was an unescaped backslash. */
  private escapeNext: boolean = false;

  /** @inheritdoc */
  public *feed(chunk: Uint8Array): Iterable<T> {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    yield* this.drain();
  }

  /** @inheritdoc */
  public *flush(): Iterable<T> {
    this.buffer += this.decoder.decode(new Uint8Array(0));
    yield* this.drain();

    // Any trailing content that didn't reach depth 0 is dropped —
    // streaming JSON requires complete values per emission.
    this.buffer = "";
    this.depth = 0;
    this.inString = false;
    this.escapeNext = false;
  }

  /**
   * Walk the buffer, emit every complete top-level value, and keep
   * the trailing partial bytes for the next call.
   */
  private *drain(): Iterable<T> {
    let valueStart = -1;

    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i]!;

      if (this.inString) {
        if (this.escapeNext) {
          this.escapeNext = false;
        } else if (ch === "\\") {
          this.escapeNext = true;
        } else if (ch === '"') {
          this.inString = false;
        }
        continue;
      }

      if (ch === '"') {
        this.inString = true;
        if (valueStart === -1) valueStart = i;
        continue;
      }

      if (ch === "{" || ch === "[") {
        if (this.depth === 0) valueStart = i;
        this.depth++;
        continue;
      }

      if (ch === "}" || ch === "]") {
        this.depth--;
        if (this.depth === 0 && valueStart !== -1) {
          const raw = this.buffer.slice(valueStart, i + 1);
          const parsed = JsonStreamParser.tryParse<T>(raw);
          if (parsed !== undefined) yield parsed;
          this.buffer = this.buffer.slice(i + 1);
          valueStart = -1;
          i = -1; // restart loop from the new buffer head
        }
        continue;
      }

      // Whitespace / commas between values are ignored when not
      // inside a value.
    }
  }

  /**
   * Best-effort `JSON.parse`. Returns `undefined` on syntax error.
   */
  private static tryParse<T>(raw: string): T | undefined {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
}
