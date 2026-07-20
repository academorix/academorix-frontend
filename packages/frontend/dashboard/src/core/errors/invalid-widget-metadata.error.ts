/**
 * @file invalid-widget-metadata.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Thrown at register time when a `@Widget()`-decorated
 *   class ships metadata that fails validation — bad key shape, empty
 *   `title` / `description`, unknown `cohort`, invalid `span`.
 *
 *   Reads the offending field's name into the message so authors can
 *   fix the manifest without hunting through the class file.
 */

/**
 * A widget entry failed validation at register time.
 *
 * The message names the specific field that failed (and the widget's
 * key if available) so the author can jump directly to the fix.
 */
export class InvalidWidgetMetadataError extends Error {
  /** The offending field (e.g. `"key"`, `"cohort"`, `"span"`). */
  public readonly field: string;

  /** Human-readable reason the value was rejected. */
  public readonly reason: string;

  /**
   * The widget's key, when known. Missing when the key itself is
   * the offending field.
   */
  public readonly widgetKey?: string;

  /**
   * @param field - The offending field name.
   * @param reason - Human-readable rejection reason.
   * @param widgetKey - The widget's key when the offender is a
   *   different field. Omitted when `field === "key"`.
   */
  public constructor(field: string, reason: string, widgetKey?: string) {
    const prefix =
      typeof widgetKey === "string" && widgetKey.length > 0
        ? `Invalid widget metadata for "${widgetKey}"`
        : "Invalid widget metadata";

    super(`${prefix}: field "${field}" — ${reason}.`);
    this.name = "InvalidWidgetMetadataError";
    this.field = field;
    this.reason = reason;
    if (widgetKey !== undefined) this.widgetKey = widgetKey;
  }
}
