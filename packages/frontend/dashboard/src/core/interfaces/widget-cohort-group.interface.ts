/**
 * @file widget-cohort-group.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Cohort projection returned by
 *   {@link WidgetCatalogueService.widgetsByCohort}. Groups every
 *   registered widget under its owning cohort.
 */

import type { WidgetCohort } from "@/core/types/widget-cohort.type";

import type { IWidgetEntry } from "./widget-entry.interface";

/**
 * A cohort header + the widgets that belong to it. Ordering mirrors
 * cohort-registration order — canonical cohorts render first, module
 * contributions append.
 */
export interface IWidgetCohortGroup {
  /** Cohort key. */
  cohort: WidgetCohort;

  /** Cohort label. */
  label: string;

  /** Cohort description. */
  description: string;

  /** Cohort icon. */
  icon: string;

  /** Widgets belonging to this cohort. */
  widgets: readonly IWidgetEntry[];
}
