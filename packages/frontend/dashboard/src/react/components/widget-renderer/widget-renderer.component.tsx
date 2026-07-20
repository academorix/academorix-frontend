/**
 * @file widget-renderer.component.tsx
 * @module @stackra/dashboard/react/components/widget-renderer
 * @description Thin dispatch component. Given a widget catalogue key
 *   and a runtime context, resolves the registered renderer via
 *   {@link WidgetRendererRegistry} and returns its React tree.
 *
 *   The component owns no markup of its own — this file is purely
 *   headless. Consumers wrap the returned tree in whatever visual
 *   shell (HeroUI Card, plain div, etc.) their design system expects.
 */

import type { IWidgetRendererProps } from "./widget-renderer.interface";
import type { IWidgetRendererContext } from "@/core/interfaces/widget-renderer-context.interface";
import type { ReactNode } from "react";

/**
 * Inert default context used when the parent didn't supply one.
 * Empty config + a no-op `onConfigChange` — widgets rendered without
 * a controlled context tree cannot persist config.
 *
 * `Object.freeze` locks the shape so a widget that mutates its
 * incoming context by accident throws in dev mode instead of
 * silently corrupting the default.
 */
const DEFAULT_CONTEXT: IWidgetRendererContext = Object.freeze({
  config: {},
  onConfigChange: (): void => {
    // No-op — see the file docblock.
  },
});

/**
 * Dispatch a widget catalogue key to its registered renderer.
 *
 * @param props - Widget key + optional context + registry.
 * @returns The rendered widget tree, or `null` when the key isn't
 *   registered — silently drops so a stale saved layout can't crash
 *   the grid.
 *
 * @example
 * ```tsx
 * import { useInject } from '@stackra/container/react';
 * import { WIDGET_RENDERER_REGISTRY } from '@stackra/dashboard';
 * import { WidgetRenderer } from '@stackra/dashboard/react';
 *
 * const registry = useInject(WIDGET_RENDERER_REGISTRY);
 * <WidgetRenderer widgetKey="kpi-athletes" registry={registry} />
 * ```
 */
export function WidgetRenderer(props: IWidgetRendererProps): ReactNode {
  const { widgetKey, context, registry } = props;

  const renderer = registry.get(widgetKey);

  if (!renderer) return null;

  return renderer(context ?? DEFAULT_CONTEXT);
}
