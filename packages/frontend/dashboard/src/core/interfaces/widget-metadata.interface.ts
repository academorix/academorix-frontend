/**
 * @file widget-metadata.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Shape stamped on a class by the `@Widget()` decorator.
 *   The {@link WidgetLoader} reads this back via `@vivtel/metadata`
 *   during discovery and hands it to `WidgetCatalogueService.
 *   registerWidget(...)` to build the runtime {@link IWidgetEntry}.
 *
 *   `IWidgetMetadata` is intentionally identical in shape to
 *   {@link IWidgetEntry} — the decorator input IS the catalogue entry
 *   without any transformation. Keeping the two interfaces separate
 *   documents intent (decorator input vs. registry value) and leaves
 *   room for the two shapes to diverge later.
 */

import type { WidgetCohort } from "@/core/types/widget-cohort.type";
import type { WidgetSpan } from "@/core/types/widget-span.type";

/**
 * Metadata a `@Widget()`-decorated class carries.
 *
 * @example
 * ```typescript
 * @Widget({
 *   key: "kpi-athletes",
 *   cohort: "numbers",
 *   title: "Athletes",
 *   description: "Total active athletes across every branch.",
 *   icon: "person",
 *   span: "third",
 *   defaultEnabled: true,
 * })
 * export class KpiAthletesWidget extends BaseWidget {
 *   public render(): ReactNode { return <KpiCard /> }
 * }
 * ```
 */
export interface IWidgetMetadata {
  /** Stable, kebab-case identifier used in layouts + the picker. */
  key: string;

  /** Cohort bucket the widget belongs to. */
  cohort: WidgetCohort;

  /** Fallback English title — the renderer may translate. */
  title: string;

  /** One-line description shown in the picker. */
  description: string;

  /** Iconify token from the shared icon set. */
  icon: string;

  /** Width hint used by the auto-layout engine. */
  span: WidgetSpan;

  /** When `true`, the widget is enabled by default on a new user's layout. */
  defaultEnabled?: boolean;
}
