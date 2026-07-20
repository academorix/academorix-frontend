/**
 * @file uri.ts
 * @module @stackra/support
 * @description Chainable URL builder.
 *   Provides a fluent interface for constructing URLs with path segments,
 *   query parameters, and fragment identifiers. Handles encoding and
 *   slash normalization automatically.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Uri Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Chainable URL builder for constructing URIs from components.
 *
 * Provides a fluent API for building URLs piece by piece: base URL,
 * path segments, query parameters, and fragment. Handles URL encoding,
 * trailing slash normalization, and query string serialization.
 *
 * @example
 * ```typescript
 * import { Uri } from '@stackra/support';
 *
 * const url = Uri.of('https://api.example.com')
 *   .path('v2')
 *   .path('users')
 *   .query({ page: '1', limit: '20' })
 *   .fragment('results')
 *   .toString();
 *
 * // 'https://api.example.com/v2/users?page=1&limit=20#results'
 * ```
 */
export class Uri {
  /** The base URL (scheme + host + port). */
  private baseUrl: string;

  /** Path segments to append to the base. */
  private segments: string[] = [];

  /** Query parameters. */
  private params: Record<string, string> = {};

  /** Fragment identifier (hash). */
  private fragmentValue: string = "";

  /**
   * Create a new Uri instance.
   *
   * @param base - The base URL (e.g., 'https://api.example.com')
   */
  private constructor(base: string) {
    // Remove trailing slash from base
    this.baseUrl = base.replace(/\/+$/, "");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Static Factory
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new Uri builder from a base URL.
   *
   * @param base - The base URL
   * @returns A new Uri instance
   *
   * @example
   * ```typescript
   * const builder = Uri.of('https://example.com');
   * ```
   */
  public static of(base: string): Uri {
    return new Uri(base);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Fluent API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Append a path segment to the URL.
   *
   * Leading and trailing slashes on the segment are normalized.
   * Multiple calls append multiple segments.
   *
   * @param segment - The path segment to append
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * Uri.of('https://api.com')
   *   .path('v1')
   *   .path('users')
   *   .path('123')
   *   .toString(); // 'https://api.com/v1/users/123'
   * ```
   */
  public path(segment: string): this {
    // Strip leading/trailing slashes and add non-empty segments
    const cleaned = segment.replace(/^\/+|\/+$/g, "");
    if (cleaned.length > 0) {
      this.segments.push(cleaned);
    }
    return this;
  }

  /**
   * Add query parameters to the URL.
   *
   * Multiple calls merge parameters. Later calls overwrite existing keys.
   *
   * @param params - Object of key-value query parameters
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * Uri.of('https://api.com/search')
   *   .query({ q: 'hello world', page: '1' })
   *   .toString(); // 'https://api.com/search?q=hello+world&page=1'
   * ```
   */
  public query(params: Record<string, string>): this {
    this.params = { ...this.params, ...params };
    return this;
  }

  /**
   * Set the fragment (hash) portion of the URL.
   *
   * @param hash - The fragment identifier (without the # prefix)
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * Uri.of('https://docs.com/guide')
   *   .fragment('installation')
   *   .toString(); // 'https://docs.com/guide#installation'
   * ```
   */
  public fragment(hash: string): this {
    this.fragmentValue = hash;
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Output
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Build and return the complete URL string.
   *
   * Combines the base URL, path segments, query parameters, and fragment
   * into a valid URL string.
   *
   * @returns The complete URL string
   *
   * @example
   * ```typescript
   * Uri.of('https://api.com')
   *   .path('users')
   *   .query({ active: 'true' })
   *   .fragment('top')
   *   .toString(); // 'https://api.com/users?active=true#top'
   * ```
   */
  public toString(): string {
    let url = this.baseUrl;

    // Append path segments
    if (this.segments.length > 0) {
      url += "/" + this.segments.join("/");
    }

    // Append query string
    const queryEntries = Object.entries(this.params);
    if (queryEntries.length > 0) {
      const queryString = queryEntries
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
      url += "?" + queryString;
    }

    // Append fragment
    if (this.fragmentValue.length > 0) {
      url += "#" + encodeURIComponent(this.fragmentValue);
    }

    return url;
  }
}
