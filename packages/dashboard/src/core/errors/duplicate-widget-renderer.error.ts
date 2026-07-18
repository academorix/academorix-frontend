/**
 * @file duplicate-widget-renderer.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Thrown by {@link WidgetRendererRegistry.register} when
 *   two renderers attempt to claim the same catalogue key.
 *
 *   Renderer collisions are almost always accidental — a hot-reload
 *   replaying a manifest, two modules independently importing the
 *   same file — so we surface the collision loudly rather than
 *   silently overwrite.
 */

/**
 * Two renderer entries collided on the same widget key. Either
 * remove the duplicate registration or reach for `replace()`
 * explicitly if the intent really was to override.
 */
export class DuplicateWidgetRendererError extends Error {
  /** The colliding widget key. */
  public readonly widgetKey: string;

  /**
   * @param widgetKey - The colliding widget key.
   */
  public constructor(widgetKey: string) {
    super(
      `Duplicate widget renderer for key "${widgetKey}". A renderer is already registered ` +
        `for this key. Use WidgetRendererRegistry.replace() to overwrite intentionally, ` +
        `or drop the second registration.`,
    );
    this.name = "DuplicateWidgetRendererError";
    this.widgetKey = widgetKey;
  }
}
