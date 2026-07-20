/**
 * @file widget-cohort-entry.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Cohort descriptor — label + description + icon used by
 *   the picker header. Registered on the {@link WidgetCatalogueService}
 *   at boot; feature modules can contribute additional cohorts via
 *   `registerCohort(...)`.
 */

import type { WidgetCohort } from "@/core/types/widget-cohort.type";

/**
 * Descriptor for a cohort bucket the picker renders in its sidebar.
 */
export interface IWidgetCohortEntry {
  /** Cohort key used to bucket widgets. */
  key: WidgetCohort;

  /** Short human-facing label shown as the picker section header. */
  label: string;

  /** One-line description surfaced under the label. */
  description: string;

  /** Iconify token from the shared icon set. */
  icon: string;
}
