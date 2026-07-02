/**
 * @file announcements.types.ts
 * @module modules/announcements/announcements.types
 *
 * @description
 * Module-local types for tenant announcements (broadcast messages to an
 * audience). A thin, module-specific shape, so it lives here rather than in the
 * shared `@/types`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.2 "Announcements & Notifications"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** Who an announcement targets. */
export type AnnouncementAudience = "all" | "branch" | "team";

/** Publication lifecycle of an announcement. */
export type AnnouncementStatus = "draft" | "published";

/** A broadcast announcement to a tenant audience. */
export interface Announcement extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string | null;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  /** ISO-8601 publish time, or `null` while still a draft. */
  published_at: string | null;
}
