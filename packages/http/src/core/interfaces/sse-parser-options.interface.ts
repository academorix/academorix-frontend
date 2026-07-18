/**
 * @file sse-parser-options.interface.ts
 * @module @stackra/http/src/interfaces
 * @description ISseParserOptions interface.
 */

/**
 * SSE parser configuration.
 */
export interface ISseParserOptions {
  /**
   * When `true`, attempt `JSON.parse` on the assembled `data` field.
   * Falls back to the raw string on parse error.
   *
   * @default true
   */
  parseJsonData?: boolean;
}
