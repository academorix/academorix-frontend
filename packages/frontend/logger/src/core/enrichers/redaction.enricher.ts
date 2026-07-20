/**
 * @file redaction.enricher.ts
 * @module @stackra/logger/core/enrichers
 * @description Redaction enricher — masks sensitive fields in log entry metadata.
 *   Supports dot-notation paths and wildcard patterns for flexible field matching.
 */

import type { ILogEntry, LogContext, ILogEnricher } from "@stackra/contracts";

import type { IRedactionConfig } from "@/core/interfaces/redaction-config.interface";

export type { IRedactionConfig };

/**
 * Redaction enricher — masks sensitive fields in `entry.meta` before dispatch.
 *
 * Supports:
 * - Direct paths: `'password'`, `'user.token'`
 * - Wildcard paths: `'*.secret'`, `'credentials.*'`
 * - Nested dot notation: `'auth.tokens.refresh'`
 *
 * Only operates on `entry.meta` — the message and context are never redacted.
 *
 * @example
 * ```typescript
 * const enricher = new RedactionEnricher({
 *   paths: ['password', 'token', '*.secret'],
 *   mask: '[REDACTED]',
 * });
 *
 * // entry.meta = { password: 'abc123', user: { secret: 'xyz' } }
 * // After enrichment: { password: '[REDACTED]', user: { secret: '[REDACTED]' } }
 * ```
 */
export class RedactionEnricher implements ILogEnricher {
  /** The mask string used to replace sensitive values. */
  private readonly mask: string;

  /** Compiled path matchers for efficient matching. */
  private readonly matchers: Array<(path: string) => boolean>;

  /**
   * @param config - Redaction configuration with paths and optional mask
   */
  public constructor(config: IRedactionConfig) {
    this.mask = config.mask ?? "***";
    this.matchers = config.paths.map((pattern) => this.compileMatcher(pattern));
  }

  /**
   * Enrich a log entry by masking sensitive fields in its metadata.
   *
   * @param entry - The log entry to process
   * @returns Entry with redacted meta fields
   */
  public enrich(entry: ILogEntry): ILogEntry {
    if (!entry.meta || Object.keys(entry.meta).length === 0) {
      return entry;
    }

    return {
      ...entry,
      meta: this.redactObject(entry.meta, ""),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private — Matching Logic
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Compile a path pattern into a matcher function.
   *
   * @param pattern - Path pattern (e.g., 'password', '*.secret', 'auth.token')
   * @returns A function that tests if a given path matches the pattern
   */
  private compileMatcher(pattern: string): (path: string) => boolean {
    // Convert wildcard pattern to regex
    const regexStr = pattern
      .split(".")
      .map((segment) => (segment === "*" ? "[^.]+" : this.escapeRegex(segment)))
      .join("\\.");

    const regex = new RegExp(`^${regexStr}$`);
    return (path: string) => regex.test(path);
  }

  /**
   * Escape special regex characters in a string.
   *
   * @param str - String to escape
   * @returns Escaped string safe for regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Recursively traverse an object and redact matching paths.
   *
   * @param obj - Object to traverse
   * @param prefix - Current path prefix (for building dot-notation paths)
   * @returns New object with redacted values
   */
  private redactObject(obj: LogContext, prefix: string): LogContext {
    const result: LogContext = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;

      if (this.shouldRedact(fullPath)) {
        result[key] = this.mask;
      } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        result[key] = this.redactObject(value as LogContext, fullPath);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Check if a path should be redacted.
   *
   * @param path - The dot-notation path to check
   * @returns True if any matcher matches this path
   */
  private shouldRedact(path: string): boolean {
    return this.matchers.some((matcher) => matcher(path));
  }
}
