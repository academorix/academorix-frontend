/**
 * @file widget-entry.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single widget entry in the cohort-based catalogue. Used
 *   by {@link WidgetCatalogueService} + the customise panel's widget
 *   picker. Distinct from {@link IWidgetDefinition}, which is the older
 *   grid-oriented catalogue shape.
 */

import type { WidgetCohort } from "@/core/types/widget-cohort.type";
import type { WidgetSpan } from "@/core/types/widget-span.type";

/**
 * Cohort-based catalogue entry.
 */
export interface IWidgetEntry {
  /** Stable identifier used in layouts + the picker. */
  key: string;

  /** Cohort bucket the widget belongs to. */
  cohort: WidgetCohort;

  /** Fallback English title; the renderer may translate. */
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
