/**
 * @file widget-renderer.interface.ts
 * @module @stackra/dashboard/react/components/widget-renderer
 * @description Props for {@link WidgetRenderer}. Family-grouped since
 *   the shape is used only via the outer component.
 */

import type { IWidgetRendererContext } from "@/core/interfaces/widget-renderer-context.interface";
import type { WidgetRendererRegistry } from "@/core/registries/widget-renderer.registry";

/**
 * Props for {@link WidgetRenderer}.
 */
export interface IWidgetRendererProps {
  /** Widget catalogue key to dispatch. */
  widgetKey: string;

  /**
   * Runtime context handed to the resolved renderer. Defaults to an
   * inert stub (empty config + no-op change handler) when omitted.
   */
  context?: IWidgetRendererContext;

  /**
   * The renderer registry. Passing an explicit registry (rather than
   * relying on a hook + `useInject` inside the component) is useful
   * in tests and in isolated preview surfaces (Storybook, embed
   * viewer). Consumers who want the container-bound singleton call
   * `useInject(WIDGET_RENDERER_REGISTRY)` at the parent site.
   */
  registry: WidgetRendererRegistry;
}
