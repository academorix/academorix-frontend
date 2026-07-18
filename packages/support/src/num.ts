/**
 * @file num.ts
 * @module @stackra/support
 * @description Static number formatting and inspection class.
 *   Provides helpers for formatting numbers as currency, percentages,
 *   file sizes, ordinals, and more. All methods are static.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Num Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Static number utility class.
 *
 * Provides formatting and inspection helpers for numeric values.
 * Methods are pure functions that never mutate their inputs.
 *
 * @example
 * ```typescript
 * import { Num } from '@stackra/support';
 *
 * Num.abbreviate(1500);           // '1.5K'
 * Num.currency(29.99, 'USD');     // '$29.99'
 * Num.fileSize(1048576);          // '1 MB'
 * Num.ordinal(3);                 // '3rd'
 * ```
 */
export class Num {
  // ══════════════════════════════════════════════════════════════════════════
  // Formatting
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Abbreviate a number with a human-readable suffix (K, M, B, T).
   *
   * @param value - The number to abbreviate
   * @returns The abbreviated string representation
   *
   * @example
   * ```typescript
   * Num.abbreviate(999);       // '999'
   * Num.abbreviate(1000);      // '1K'
   * Num.abbreviate(1500);      // '1.5K'
   * Num.abbreviate(1000000);   // '1M'
   * Num.abbreviate(1500000000); // '1.5B'
   * ```
   */
  public static abbreviate(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1_000_000_000_000) {
      return sign + Num.formatAbbreviated(absValue / 1_000_000_000_000) + "T";
    }
    if (absValue >= 1_000_000_000) {
      return sign + Num.formatAbbreviated(absValue / 1_000_000_000) + "B";
    }
    if (absValue >= 1_000_000) {
      return sign + Num.formatAbbreviated(absValue / 1_000_000) + "M";
    }
    if (absValue >= 1_000) {
      return sign + Num.formatAbbreviated(absValue / 1_000) + "K";
    }

    return String(value);
  }

  /**
   * Format a number with a given number of decimal places and locale.
   *
   * @param value - The number to format
   * @param decimals - Number of decimal places (default: 0)
   * @param locale - The locale for formatting (default: 'en-US')
   * @returns The formatted number string
   *
   * @example
   * ```typescript
   * Num.format(1234567.89);         // '1,234,568'
   * Num.format(1234567.89, 2);      // '1,234,567.89'
   * Num.format(1234.5, 2, 'de-DE'); // '1.234,50'
   * ```
   */
  public static format(value: number, decimals: number = 0, locale: string = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Format a number as a percentage.
   *
   * @param value - The number to format (0.5 = 50%, 50 = 50%)
   * @param decimals - Number of decimal places (default: 0)
   * @returns The formatted percentage string
   *
   * @example
   * ```typescript
   * Num.percentage(75);       // '75%'
   * Num.percentage(75.5, 1);  // '75.5%'
   * Num.percentage(0.75);     // '0.75%'
   * ```
   */
  public static percentage(value: number, decimals: number = 0): string {
    return value.toFixed(decimals) + "%";
  }

  /**
   * Format a number as currency.
   *
   * @param value - The monetary amount
   * @param currency - The ISO 4217 currency code (default: 'USD')
   * @param locale - The locale for formatting (default: 'en-US')
   * @returns The formatted currency string
   *
   * @example
   * ```typescript
   * Num.currency(29.99);                 // '$29.99'
   * Num.currency(29.99, 'EUR', 'de-DE'); // '29,99 €'
   * Num.currency(1000, 'GBP');           // '£1,000.00'
   * ```
   */
  public static currency(
    value: number,
    currency: string = "USD",
    locale: string = "en-US",
  ): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  }

  /**
   * Get the ordinal suffix for a number (1st, 2nd, 3rd, etc.).
   *
   * @param value - The integer value
   * @returns The number with its ordinal suffix
   *
   * @example
   * ```typescript
   * Num.ordinal(1);  // '1st'
   * Num.ordinal(2);  // '2nd'
   * Num.ordinal(3);  // '3rd'
   * Num.ordinal(4);  // '4th'
   * Num.ordinal(11); // '11th'
   * Num.ordinal(21); // '21st'
   * ```
   */
  public static ordinal(value: number): string {
    const abs = Math.abs(value);
    const remainder100 = abs % 100;
    const remainder10 = abs % 10;

    // Special case for 11, 12, 13
    if (remainder100 >= 11 && remainder100 <= 13) {
      return value + "th";
    }

    switch (remainder10) {
      case 1:
        return value + "st";
      case 2:
        return value + "nd";
      case 3:
        return value + "rd";
      default:
        return value + "th";
    }
  }

  /**
   * Format a byte count as a human-readable file size.
   *
   * @param bytes - The number of bytes
   * @param decimals - Number of decimal places (default: 2)
   * @returns The formatted file size string
   *
   * @example
   * ```typescript
   * Num.fileSize(0);           // '0 Bytes'
   * Num.fileSize(1024);        // '1 KB'
   * Num.fileSize(1048576);     // '1 MB'
   * Num.fileSize(1073741824);  // '1 GB'
   * Num.fileSize(1536, 1);    // '1.5 KB'
   * ```
   */
  public static fileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const unitIndex = Math.min(i, units.length - 1);

    const formatted = parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(decimals));
    return formatted + " " + units[unitIndex];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Clamping & Bounds
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Clamp a number between a minimum and maximum value.
   *
   * @param value - The number to clamp
   * @param min - The minimum bound
   * @param max - The maximum bound
   * @returns The clamped number
   *
   * @example
   * ```typescript
   * Num.clamp(5, 0, 10);   // 5
   * Num.clamp(-5, 0, 10);  // 0
   * Num.clamp(15, 0, 10);  // 10
   * ```
   */
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Inspection
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a number is even.
   *
   * @param value - The number to check
   * @returns True if the number is even
   *
   * @example
   * ```typescript
   * Num.isEven(4);  // true
   * Num.isEven(3);  // false
   * ```
   */
  public static isEven(value: number): boolean {
    return value % 2 === 0;
  }

  /**
   * Check if a number is odd.
   *
   * @param value - The number to check
   * @returns True if the number is odd
   *
   * @example
   * ```typescript
   * Num.isOdd(3);  // true
   * Num.isOdd(4);  // false
   * ```
   */
  public static isOdd(value: number): boolean {
    return value % 2 !== 0;
  }

  /**
   * Check if a number is between two bounds (inclusive).
   *
   * @param value - The number to check
   * @param min - The lower bound
   * @param max - The upper bound
   * @returns True if the value is between min and max (inclusive)
   *
   * @example
   * ```typescript
   * Num.isBetween(5, 1, 10);   // true
   * Num.isBetween(0, 1, 10);   // false
   * Num.isBetween(10, 1, 10);  // true
   * ```
   */
  public static isBetween(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Format a divided number for abbreviation, removing trailing zeros.
   *
   * @param value - The divided value (e.g., 1.5 for 1500/1000)
   * @returns Clean string representation
   */
  private static formatAbbreviated(value: number): string {
    // Show one decimal place if there is a meaningful fractional part
    const rounded = Math.round(value * 10) / 10;
    if (rounded === Math.floor(rounded)) {
      return String(Math.floor(rounded));
    }
    return rounded.toFixed(1);
  }
}
