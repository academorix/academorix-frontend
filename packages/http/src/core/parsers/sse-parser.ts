/**
 * Server-Sent Events parser.
 *
 * Implements the `text/event-stream` framing rules from the WHATWG
 * spec. Frames are separated by blank lines; each frame is split
 * into `event:`, `data:`, `id:`, and `retry:` lines.
 *
 * @module @stackra/http/parsers/sse-parser
 */

import type { ISseEvent } from '@stackra/contracts';

import type { ISseParserOptions } from '../interfaces/sse-parser-options.interface';
import type { IStreamParser } from './stream-parser.interface';

/**
 * SSE parser. Yields one `ISseEvent<T>` per complete frame.
 *
 * @typeParam T - Decoded payload type.
 */
export class SseStreamParser<T = unknown> implements IStreamParser<ISseEvent<T>> {
  /** UTF-8 streaming decoder. */
  private readonly decoder: TextDecoder = new TextDecoder('utf-8', { fatal: false });

  /** Pending text awaiting a frame boundary. */
  private buffer: string = '';

  /** Last-seen event id — used to populate `Last-Event-ID` on reconnect. */
  private lastEventId: string = '';

  /** Whether to JSON-parse the `data` field. */
  private readonly parseJsonData: boolean;

  /**
   * @param options - Parser options.
   */
  public constructor(options: ISseParserOptions = {}) {
    this.parseJsonData = options.parseJsonData ?? true;
  }

  /**
   * Read the most recent event id seen during streaming. The SSE
   * client uses this to populate `Last-Event-ID` on reconnect.
   */
  public getLastEventId(): string {
    return this.lastEventId;
  }

  /** @inheritdoc */
  public *feed(chunk: Uint8Array): Iterable<ISseEvent<T>> {
    this.buffer += this.decoder.decode(chunk, { stream: true });

    // Split frames on the blank-line boundary. Both `\n\n` and
    // `\r\n\r\n` are valid frame separators per the spec.
    while (true) {
      const boundary = this.findBoundary(this.buffer);
      if (boundary === -1) break;

      const rawFrame = this.buffer.slice(0, boundary.start);
      this.buffer = this.buffer.slice(boundary.end);

      const event = this.parseFrame(rawFrame);
      if (event !== undefined) yield event;
    }
  }

  /** @inheritdoc */
  public *flush(): Iterable<ISseEvent<T>> {
    this.buffer += this.decoder.decode(new Uint8Array(0));

    if (this.buffer.length > 0) {
      const event = this.parseFrame(this.buffer);
      this.buffer = '';
      if (event !== undefined) yield event;
    }
  }

  /**
   * Locate the earliest frame boundary in the buffer.
   *
   * @param buffer - Current buffer contents.
   * @returns `{ start, end }` of the boundary or `-1` when none.
   */
  private findBoundary(buffer: string): { start: number; end: number } | -1 {
    const lf = buffer.indexOf('\n\n');
    const crlf = buffer.indexOf('\r\n\r\n');

    if (lf === -1 && crlf === -1) return -1;
    if (lf === -1) return { start: crlf, end: crlf + 4 };
    if (crlf === -1) return { start: lf, end: lf + 2 };
    if (crlf < lf) return { start: crlf, end: crlf + 4 };
    return { start: lf, end: lf + 2 };
  }

  /**
   * Parse one raw frame string into an `ISseEvent`. Returns
   * `undefined` for empty/comment-only frames.
   *
   * @param frame - Raw frame text (no trailing blank line).
   * @returns Parsed event or `undefined`.
   */
  private parseFrame(frame: string): ISseEvent<T> | undefined {
    let id: string | undefined;
    let event: string | undefined;
    let retry: number | undefined;
    const dataLines: string[] = [];

    for (const rawLine of frame.split(/\r?\n/)) {
      const line = rawLine.replace(/\r$/, '');
      if (line.length === 0) continue;
      // Comment lines start with `:` per spec.
      if (line.startsWith(':')) continue;

      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      // Per spec: skip a single leading space after the colon if present.
      let value = colon === -1 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);

      switch (field) {
        case 'id':
          id = value;
          this.lastEventId = value;
          break;
        case 'event':
          event = value;
          break;
        case 'retry': {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isNaN(parsed)) retry = parsed;
          break;
        }
        case 'data':
          dataLines.push(value);
          break;
        default:
          // Unknown fields ignored per spec.
          break;
      }
    }

    if (dataLines.length === 0 && id === undefined && event === undefined && retry === undefined) {
      return undefined;
    }

    const dataText = dataLines.join('\n');
    const data = this.decodeData(dataText);

    const sseEvent: ISseEvent<T> = { data: data as T };
    if (id !== undefined) sseEvent.id = id;
    if (event !== undefined) sseEvent.type = event;
    if (retry !== undefined) sseEvent.retry = retry;
    return sseEvent;
  }

  /**
   * Decode the assembled `data` field. JSON parsing is best-effort
   * — if it fails we return the raw string so consumers always see
   * the original payload.
   *
   * @param raw - Assembled data text.
   * @returns Decoded value (object, primitive, or raw string).
   */
  private decodeData(raw: string): unknown {
    if (!this.parseJsonData) return raw;
    if (raw.length === 0) return raw;

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}
