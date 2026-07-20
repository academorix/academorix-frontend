/**
 * @file interpolation.enricher.ts
 * @module @stackra/logger/core/enrichers
 * @description PSR-3 style placeholder interpolation enricher.
 *   Replaces `{key}` patterns in the log message with values from entry.meta.
 *   Registered as the FIRST enricher (before sampling, redaction) to ensure
 *   the interpolated message reflects original meta values.
 */

import type { ILogEnricher, ILogEntry } from "@stackra/contracts";
import { PLACEHOLDER_REGEX } from "./placeholder-regex.constant";

/**
 * Regex pattern matching `{key}` placeholder tokens in messages.
 */

/**
 * Interpolation enricher — replaces `{key}` placeholders in messages.
 *
 * Follows the PSR-3 placeholder interpolation convention. Scans the
 * entry message for `{key}` patterns and replaces them with the
 * corresponding value from `entry.meta`. Unmatched placeholders are
 * left as-is.
 *
 * @example
 * ```typescript
 * // Input:  message = 'User {userId} created', meta = { userId: 'abc' }
 * // Output: message = 'User abc created', meta = { userId: 'abc' }
 *
 * const enricher = new InterpolationEnricher();
 * const result = enricher.enrich(entry);
 * ```
 */
export class InterpolationEnricher implements ILogEnricher {
  /** Enricher identifier. */
  public readonly name = "interpolation";

  /**
   * Interpolate placeholders in the entry message using meta values.
   *
   * @param entry - Log entry with potential placeholders in message
   * @returns Entry with interpolated message, or original if no placeholders found
   */
  public enrich(entry: ILogEntry): ILogEntry | null {
    if (!entry.meta || !entry.message.includes("{")) {
      return entry;
    }

    const interpolated = entry.message.replace(PLACEHOLDER_REGEX, (match, key: string) => {
      const value = entry.meta?.[key];
      if (value === undefined || value === null) {
        return match; // Leave unmatched placeholders as-is
      }
      return String(value);
    });

    if (interpolated === entry.message) {
      return entry;
    }

    return {
      ...entry,
      message: interpolated,
    };
  }
}
