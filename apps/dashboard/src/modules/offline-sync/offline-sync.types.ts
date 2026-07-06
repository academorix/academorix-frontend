/**
 * @file offline-sync.types.ts
 * @module modules/offline-sync/offline-sync.types
 *
 * @description
 * Module-local shape for a **pending offline-sync item** — a change captured on
 * the field while offline, queued to push when connectivity returns. Kept local
 * as a sync-affordance projection over the domain records that were edited.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.5 "Attendance" (offline capture)
 */

import type { BaseModel, TenantScoped } from "@/types";

/** A single queued change awaiting sync to the server. */
export interface SyncItem extends BaseModel, TenantScoped {
  /** Domain area the change belongs to, e.g. `"attendance"`, `"progress"`. */
  entity: string;
  /** Human summary of the queued change. */
  summary: string;
  /** ISO-8601 time the change was captured offline. */
  captured_at: string;
  /** Who captured it (staff id/name), or `null`. */
  captured_by: string | null;
}
