/**
 * @file dashboard-module-options.interface.ts
 * @module @stackra/dashboard/core/module
 * @description Configuration surface for
 *   {@link DashboardModule.forRoot}. Consumers pass the storage-owner
 *   coordinates plus any additional cohorts + widgets they want
 *   registered at boot.
 */

import type { IWidgetCohortEntry } from "@/core/interfaces/widget-cohort-entry.interface";
import type { IWidgetEntry } from "@/core/interfaces/widget-entry.interface";

/**
 * Dashboard module configuration.
 *
 * The `storage` sub-object is composite-family with the outer options
 * — it is used only inside `IDashboardModuleOptions`, so it stays
 * inline per the code-standards composite-family rule.
 */
export interface IDashboardModuleOptions {
  /**
   * Storage-adapter coordinates. The default localStorage
   * implementation reads / writes under these ids.
   */
  storage?: {
    /** Synthetic owner id used to scope persisted dashboards. */
    ownerId?: string;
    /** Owning tenant id embedded in every persisted dashboard. */
    tenantId?: string;
  };

  /**
   * Additional widget cohorts to register at boot. The framework's
   * canonical cohorts always seed first; contributions append.
   */
  cohorts?: readonly IWidgetCohortEntry[];

  /**
   * Additional widgets to register at boot. Widgets can freely
   * reference cohorts registered above.
   */
  widgets?: readonly IWidgetEntry[];
}
