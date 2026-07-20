/**
 * @file widget-provider.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Runtime shape every `@Widget()`-decorated class
 *   implements.
 *
 *   Mirrors the console package's `BaseCommand.handle()` contract —
 *   the abstract base ({@link BaseWidget}) implements this interface
 *   and every concrete widget subclass overrides `render(context)`.
 *   The framework never talks to concrete widget classes directly;
 *   it always goes through this contract.
 */

import type { ReactNode } from "react";

import type { IWidgetRendererContext } from "./widget-renderer-context.interface";

/**
 * Contract every widget class fulfils.
 *
 * The class-based provider path is what the {@link WidgetLoader}
 * discovers via `IDiscoveryService` — the loader validates
 * `instance instanceof BaseWidget`, reads metadata via
 * `readWidgetMetadata`, and binds `instance.render.bind(instance)` as
 * the renderer.
 *
 * Consumers that don't need class-based lifecycle (a pure React
 * component with no state) can still pass a plain
 * {@link WidgetRenderer} function to {@link WidgetRendererRegistry.
 * register} directly.
 */
export interface IWidgetProvider {
  /**
   * Render the widget under the given runtime context.
   *
   * @param context - Widget runtime context (config + change callback).
   * @returns The rendered React tree for this widget instance.
   */
  render(context: IWidgetRendererContext): ReactNode;
}
