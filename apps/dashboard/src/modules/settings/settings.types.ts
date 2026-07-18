/**
 * @file settings.types.ts
 * @module modules/settings/settings.types
 *
 * @description
 * Shared TypeScript types for the Settings module. Kept intentionally narrow
 * in Phase 4a — the concrete section schemas (currency, tax profiles, sports
 * catalogue, notification defaults) land alongside their forms in Phase 4b,
 * so the current file only defines the section identifier + the surface
 * `SettingsSection` shape the secondary sidebar consumes.
 *
 * See `DASHBOARD_UX_PLAN.md` §9.2 for the canonical section list and §9.3 for
 * the full JSON schema this module will grow into.
 */

import type { IconType } from "@stackra/ui/icons";

/** Stable identifier for every top-level section in the module. */
export type SettingsSectionId =
  | "general"
  | "branding"
  | "locale"
  | "language"
  | "currency"
  | "sports"
  | "notifications"
  | "safeguarding"
  | "billing"
  | "integrations"
  | "api-keys"
  | "webhooks"
  | "feature-flags"
  | "attributes"
  | "data"
  | "danger";

/**
 * A grouping bucket used by the secondary sidebar. Matches the group order
 * declared in `DASHBOARD_UX_PLAN.md` §9.2.
 */
export type SettingsGroupKey =
  "workspace" | "operations" | "money" | "extend" | "advanced" | "danger";

/** Presentation metadata for a section. */
export interface SettingsSectionDescriptor {
  /** Stable identifier used in the URL: `/settings/<id>`. */
  id: SettingsSectionId;
  /** Sidebar and page-header label. */
  label: string;
  /** One-line description shown at the top of the section page. */
  description: string;
  /** Icon rendered on the sidebar item. */
  icon: IconType;
  /** Which sidebar group the section belongs to. */
  group: SettingsGroupKey;
  /**
   * Permission required to view (and by default, edit) this section. Mutation
   * buttons inside a section may additionally gate on a per-verb permission,
   * but the sidebar entry itself is hidden if this one is missing.
   */
  requiredPermission?: string;
  /**
   * Whether the full section UI has shipped yet. `false` sections render a
   * "Coming soon" placeholder page in Phase 4a so operators can still
   * navigate the sidebar; Phase 4b flips each flag as the section lands.
   */
  isAvailable: boolean;
}
