/**
 * @file base-widget.provider.ts
 * @module @stackra/dashboard/core/base
 * @description Abstract base class every `@Widget()`-decorated class
 *   extends. Mirrors the console package's `BaseCommand` shape — a
 *   thin declared contract so the {@link WidgetLoader} can validate
 *   discovered providers with an `instance instanceof BaseWidget`
 *   check rather than a fragile structural typeof.
 *
 *   Base classes stay logic-free by design. Subclasses own the
 *   render output; the base exists so the framework has a single
 *   inheritance seam to gate discovery on.
 */

import type { ReactNode } from "react";

import type { IWidgetProvider } from "@/core/interfaces/widget-provider.interface";
import type { IWidgetRendererContext } from "@/core/interfaces/widget-renderer-context.interface";

/**
 * Abstract base class every dashboard widget class extends.
 *
 * The {@link WidgetLoader} uses `instance instanceof BaseWidget` as
 * the runtime shape check on every discovered provider — a widget
 * that forgets to extend this class silently drops out of discovery
 * (with a warning) rather than crashing the whole loader.
 *
 * Subclasses override `render(context)` — the method never accesses
 * any instance state the base owns, so extending this class is a
 * zero-cost declaration.
 *
 * @example
 * ```tsx
 * @Widget({
 *   key: "kpi-athletes",
 *   cohort: "numbers",
 *   title: "Athletes",
 *   description: "Total active athletes across every branch.",
 *   icon: "person",
 *   span: "third",
 * })
 * export class KpiAthletesWidget extends BaseWidget {
 *   public render(): ReactNode {
 *     return <KpiCard label="Athletes" value={42} />;
 *   }
 * }
 * ```
 */
export abstract class BaseWidget implements IWidgetProvider {
  /**
   * Render the widget for a given runtime context.
   *
   * Subclasses override this method — the base declares the contract
   * only. Returning `null` is legal for a widget that renders
   * nothing under the current config (e.g. a feature-flagged card).
   *
   * @param context - Widget runtime context (config + change callback).
   * @returns The React tree to render for the widget instance.
   */
  public abstract render(context: IWidgetRendererContext): ReactNode;
}
