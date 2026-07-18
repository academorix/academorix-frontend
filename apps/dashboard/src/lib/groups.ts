/**
 * @file groups.ts
 * @module lib/groups
 *
 * @description
 * Sidebar group metadata — label, icon, and canonical display order for every
 * bucket a resource can belong to. The sidebar and command palette both walk
 * {@link navGroups} to render sections in the same, stable order.
 */

import type { SidebarGroupKey } from "@/lib/module";

/** A sidebar group entry (a section in the primary nav). */
export type NavGroup = {
  key: SidebarGroupKey | "other";
  /** Fallback English label; the runtime prefers `i18n('sidebar.group.<key>')`. */
  label: string;
  /** Iconify token used as the section glyph on some surfaces. */
  icon: string;
  /** Display order (ascending). */
  order: number;
};

/**
 * Canonical group order. The sidebar walks this list in order and renders one
 * `<Sidebar.Group>` block per key.
 *
 * The taxonomy is intentionally verb/mental-model based (see the docblock on
 * {@link SidebarGroupKey}) — nine primary buckets plus `administration`
 * (rendered muted at the bottom) plus `ai` (reserved) plus `other`
 * (trailing catch-all for resources that forgot to declare `meta.groupKey`).
 *
 * Icons chosen for the collapsed sidebar's group-cluster separators — each
 * has to be legible at 16px and semantically distinct from adjacent groups.
 */
export const navGroups: readonly NavGroup[] = [
  { key: "overview", label: "Overview", icon: "square-check", order: 0 },
  { key: "people", label: "People", icon: "persons", order: 1 },
  { key: "programs", label: "Programs", icon: "circles-4-square", order: 2 },
  { key: "schedule", label: "Schedule", icon: "calendar", order: 3 },
  { key: "records", label: "Records", icon: "list-check", order: 4 },
  { key: "communications", label: "Communications", icon: "megaphone", order: 5 },
  { key: "growth", label: "Growth", icon: "rocket", order: 6 },
  { key: "finance", label: "Finance", icon: "circle-dollar", order: 7 },
  { key: "administration", label: "Administration", icon: "gear", order: 8 },
  { key: "ai", label: "AI", icon: "sparkles", order: 9 },
  // Deprecated: legacy monolithic bucket. Modules that still
  // declare `"operations"` fall through this entry at runtime; the
  // resolver in `@/lib/module` maps them to the closest new group
  // so the UI never renders a phantom "Operations" section.
  { key: "operations", label: "Operations", icon: "layers", order: 10 },
  { key: "other", label: "Other", icon: "dots-3-horizontal", order: 11 },
] as const;

/** Fast lookup: `groupOrder["operations"] === 1`. */
export const groupOrder: Record<NavGroup["key"], number> = navGroups.reduce(
  (acc, group) => ({ ...acc, [group.key]: group.order }),
  {} as Record<NavGroup["key"], number>,
);

/** Fast lookup: `groupLabel["operations"] === "Operations"`. */
export const groupLabel: Record<NavGroup["key"], string> = navGroups.reduce(
  (acc, group) => ({ ...acc, [group.key]: group.label }),
  {} as Record<NavGroup["key"], string>,
);
