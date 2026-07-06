/**
 * @file public-site.types.ts
 * @module modules/public-site/public-site.types
 *
 * @description
 * Module-local shape for the **public-site CMS** — the marketing pages a tenant
 * publishes on their public website. Kept local as a content-management
 * projection distinct from the app's operational domain.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §19 "Public Site & CMS"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** Publication state of a public page. */
export const PUBLIC_PAGE_STATUSES = ["published", "draft", "scheduled"] as const;

/** A single public-page status (e.g. `"published"`). */
export type PublicPageStatus = (typeof PUBLIC_PAGE_STATUSES)[number];

/** Human-readable labels for {@link PublicPageStatus}. */
export const PUBLIC_PAGE_STATUS_LABELS: Record<PublicPageStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
};

/**
 * A **public page** in the tenant's marketing site CMS.
 */
export interface PublicPage extends BaseModel, TenantScoped {
  /** URL slug, e.g. `"about"` (`""`/`"home"` for the landing page). */
  slug: string;
  title: string;
  status: PublicPageStatus;
  /** Layout template, e.g. `"landing"`, `"about"`, `"programs"`, `"contact"`. */
  template: string;
  /** Whether this is the site's home page. */
  is_home: boolean;
  /** Who last edited the page (user id/name), or `null`. */
  updated_by: string | null;
}
