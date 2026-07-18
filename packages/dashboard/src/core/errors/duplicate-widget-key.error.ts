/**
 * @file duplicate-widget-key.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Thrown by {@link WidgetRegistry.register} when two
 *   widget classes attempt to claim the same catalogue key.
 *
 *   Fail-loud: silent overwrite would let a hot-reloaded feature
 *   module shadow a shipped widget with a stale closure, or a typo
 *   collision would silently drop half the picker.
 */

/**
 * Two `@Widget()`-decorated classes tried to register with the same
 * `key`. Rename one of the two — widget keys must be unique across
 * every module in the container.
 */
export class DuplicateWidgetKeyError extends Error {
  /** The colliding widget key. */
  public readonly widgetKey: string;

  /** Class name of the widget that registered first. */
  public readonly existingClass: string;

  /** Class name of the widget attempting to re-register. */
  public readonly newClass: string;

  /**
   * @param widgetKey - The colliding widget key.
   * @param existingClass - Class name of the first registrant.
   * @param newClass - Class name of the second registrant.
   */
  public constructor(widgetKey: string, existingClass: string, newClass: string) {
    super(
      `Duplicate widget key "${widgetKey}": already registered by "${existingClass}", ` +
        `conflicting with "${newClass}". Each @Widget() key must be unique ` +
        `across every module in the container — rename one of the two.`,
    );
    this.name = "DuplicateWidgetKeyError";
    this.widgetKey = widgetKey;
    this.existingClass = existingClass;
    this.newClass = newClass;
  }
}
