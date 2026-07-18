/**
 * @file widget-renderer-context.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Runtime context passed to every widget renderer. The
 *   shell resolves scope + identity once per session and hands them to
 *   each renderer so a widget never has to `useGetIdentity` or
 *   `useScope` on its own.
 */

/**
 * Runtime context handed to every {@link WidgetRenderer}.
 */
export interface IWidgetRendererContext {
  /**
   * The widget's persisted configuration. Widgets own the shape; the
   * shell only reads and writes it as an opaque record. Empty on
   * first render.
   */
  config: Record<string, unknown>;

  /**
   * Persist a new configuration for this widget instance. The shell
   * debounces to avoid thrashing the persistence layer during rapid
   * interactions.
   */
  onConfigChange: (next: Record<string, unknown>) => void;
}
