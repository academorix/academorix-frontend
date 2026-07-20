/**
 * @file html-string.ts
 * @module @stackra/support
 * @description Safe HTML string wrapper.
 *   Marks a string as trusted HTML content that should NOT be escaped
 *   when rendered. Used by template engines and rendering pipelines
 *   to distinguish between raw user input (unsafe) and pre-sanitized
 *   or developer-authored HTML (safe).
 */

// ════════════════════════════════════════════════════════════════════════════════
// HtmlString Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Wrapper that marks a string as trusted, pre-sanitized HTML.
 *
 * When a rendering engine encounters an `HtmlString` instance, it should
 * output the raw content without escaping. Regular strings should always
 * be HTML-escaped before rendering.
 *
 * This class does NOT sanitize — it merely marks content as safe.
 * The caller is responsible for ensuring the HTML is actually safe
 * before wrapping it in `HtmlString`.
 *
 * @example
 * ```typescript
 * import { HtmlString } from '@stackra/support';
 *
 * // Mark trusted content as safe HTML
 * const safe = new HtmlString('<strong>Hello</strong>');
 * safe.toString();  // '<strong>Hello</strong>' (no escaping)
 * safe.toHtml();    // '<strong>Hello</strong>'
 *
 * // In a template engine:
 * // if (value instanceof HtmlString) render raw
 * // else escapeHtml(value)
 * ```
 */
export class HtmlString {
  /** The raw HTML content. */
  private readonly html: string;

  /**
   * Create a new HtmlString instance.
   *
   * @param html - The trusted HTML string
   */
  public constructor(html: string) {
    this.html = html;
  }

  /**
   * Get the raw HTML string.
   *
   * @returns The unescaped HTML content
   *
   * @example
   * ```typescript
   * new HtmlString('<em>text</em>').toHtml(); // '<em>text</em>'
   * ```
   */
  public toHtml(): string {
    return this.html;
  }

  /**
   * Convert to string — returns the raw HTML.
   *
   * This allows `HtmlString` to be used in template literals and
   * string concatenation contexts seamlessly.
   *
   * @returns The raw HTML content
   *
   * @example
   * ```typescript
   * const safe = new HtmlString('<br/>');
   * `output: ${safe}`; // 'output: <br/>'
   * ```
   */
  public toString(): string {
    return this.html;
  }

  /**
   * Check if this HtmlString is empty.
   *
   * @returns True if the HTML content has zero length
   *
   * @example
   * ```typescript
   * new HtmlString('').isEmpty();      // true
   * new HtmlString('<p>hi</p>').isEmpty(); // false
   * ```
   */
  public isEmpty(): boolean {
    return this.html.length === 0;
  }

  /**
   * Check if this HtmlString is not empty.
   *
   * @returns True if the HTML content has content
   *
   * @example
   * ```typescript
   * new HtmlString('<p>hi</p>').isNotEmpty(); // true
   * ```
   */
  public isNotEmpty(): boolean {
    return this.html.length > 0;
  }

  /**
   * Get the length of the raw HTML string.
   *
   * @returns The character length of the HTML content
   *
   * @example
   * ```typescript
   * new HtmlString('<br/>').length; // 5
   * ```
   */
  public get length(): number {
    return this.html.length;
  }
}
