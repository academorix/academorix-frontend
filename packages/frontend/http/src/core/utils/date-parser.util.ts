/**
 * Date serialization / parsing helper.
 *
 * Bridges JavaScript `Date` objects with the ISO 8601 strings APIs
 * typically expect on the wire. Used by `TransformInterceptor` for
 * automatic conversion both directions.
 *
 * @module @stackra/http/utils/date-parser
 */

/**
 * Recursive date conversion helpers.
 */
export class DateParser {
  /**
   * ISO 8601 detection regex. Matches:
   *
   * - `2024-01-15T10:30:00.000Z`
   * - `2024-01-15T10:30:00Z`
   * - `2024-01-15T10:30:00.000`
   * - `2024-01-15T10:30:00`
   */
  private static readonly ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z)?$/;

  /**
   * Walk an arbitrary structure and convert ISO 8601 strings to
   * `Date` objects. Non-string values, primitives, and existing
   * `Date` objects pass through unchanged.
   *
   * @param input - Value to walk.
   * @returns Walked value with parsed dates.
   */
  public static parseDates(input: unknown): unknown {
    if (input === null || input === undefined) return input;

    if (typeof input === "string" && DateParser.ISO_8601_REGEX.test(input)) {
      return new Date(input);
    }

    if (typeof input !== "object") return input;
    if (input instanceof Date) return input;

    if (Array.isArray(input)) {
      return input.map((item) => DateParser.parseDates(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = DateParser.parseDates(value);
    }
    return result;
  }

  /**
   * Walk an arbitrary structure and convert `Date` objects to ISO
   * 8601 strings. Non-Date values pass through unchanged.
   *
   * @param input - Value to walk.
   * @returns Walked value with serialized dates.
   */
  public static serializeDates(input: unknown): unknown {
    if (input === null || input === undefined) return input;
    if (input instanceof Date) return input.toISOString();
    if (typeof input !== "object") return input;

    if (Array.isArray(input)) {
      return input.map((item) => DateParser.serializeDates(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = DateParser.serializeDates(value);
    }
    return result;
  }
}
