/**
 * Stream parser factory.
 *
 * Maps an `HttpStreamFormat` to its concrete parser instance. Used by
 * `HttpClient.stream()` to build the right parser without `if/else`
 * chains in the client itself.
 *
 * @module @stackra/http/parsers/parser-factory
 */

import { HttpStreamFormat } from '@stackra/contracts';

import type { IStreamParser } from './stream-parser.interface';
import { BinaryStreamParser } from './binary-parser';
import { JsonStreamParser } from './json-stream-parser';
import { NdjsonStreamParser } from './ndjson-parser';
import { SseStreamParser } from './sse-parser';
import { TextStreamParser } from './text-parser';

/**
 * Build the right parser for a streaming format.
 *
 * @typeParam T - Decoded value type. Defaults to `unknown`.
 * @param format - Wire format from `IStreamConfig.format`.
 * @returns Parser instance.
 */
export function createStreamParser<T = unknown>(format: HttpStreamFormat): IStreamParser<T> {
  switch (format) {
    case HttpStreamFormat.Sse:
      return new SseStreamParser<T>() as unknown as IStreamParser<T>;
    case HttpStreamFormat.Ndjson:
      return new NdjsonStreamParser<T>();
    case HttpStreamFormat.Json:
      return new JsonStreamParser<T>();
    case HttpStreamFormat.Text:
      return new TextStreamParser() as unknown as IStreamParser<T>;
    case HttpStreamFormat.Binary:
      return new BinaryStreamParser() as unknown as IStreamParser<T>;
    default:
      return new BinaryStreamParser() as unknown as IStreamParser<T>;
  }
}
