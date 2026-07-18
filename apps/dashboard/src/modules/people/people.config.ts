/**
 * @file people.config.ts
 * @module modules/people/people.config
 *
 * @description
 * Display config for the People module — human labels, role glyphs, and the
 * semantic chip colour per role/status. Kept in one place so the list,
 * show, and merge pages render the same values without duplicating maps.
 */

import {
  AcademicCapIcon,
  BriefcaseIcon,
  HeartIcon,
  UserGroupIcon,
  UsersIcon,
} from "@stackra/ui/icons/heroicon/outline";

import type { ProfileStatus, RoleInTenant } from "@/modules/people/people.types";
import type { IconType } from "@stackra/ui/icons";

/**
 * Icon glyph per role-in-tenant. Falls back to the generic {@link UsersIcon}
 * for unknown values via {@link iconForRoleInTenant} so the UI never renders
 * a blank cell if the enum ever grows on the backend before the frontend
 * catches up.
 */
export const ROLE_IN_TENANT_ICONS: Record<RoleInTenant, IconType> = {
  athlete: AcademicCapIcon,
  coach: UserGroupIcon,
  staff: BriefcaseIcon,
  guardian: HeartIcon,
};

/**
 * Chip colour per role-in-tenant. Uses the same soft-chip vocabulary as the
 * rest of the app so a person-shaped page reads consistently.
 */
export const ROLE_IN_TENANT_CHIP_COLORS: Record<
  RoleInTenant,
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  athlete: "accent",
  coach: "success",
  staff: "default",
  guardian: "warning",
};

/**
 * Chip colour per profile status. `active` is green, `inactive` is neutral —
 * an offboarded projection should not scream.
 */
export const PROFILE_STATUS_CHIP_COLORS: Record<ProfileStatus, "default" | "success" | "danger"> = {
  active: "success",
  inactive: "default",
};

/**
 * Well-known external integration keys. Drives a small label map on the
 * detail page so `stripe` renders as `"Stripe customer"` rather than the
 * raw key. Unknown keys fall through to their raw form.
 */
export const EXTERNAL_ID_LABELS: Record<string, string> = {
  stripe: "Stripe customer",
  mailchimp: "MailChimp subscriber",
  intercom: "Intercom contact",
  hubspot: "HubSpot contact",
  salesforce: "Salesforce contact",
  segment: "Segment user",
};

/** Placeholder rendered in every "empty" cell across the module. */
export const EMPTY_PLACEHOLDER = "—";

/**
 * Resolves the icon for a (possibly unknown) role-in-tenant value.
 *
 * @param role - The role string (known or backend-added).
 * @returns The icon component to render.
 */
export function iconForRoleInTenant(role: string): IconType {
  return (ROLE_IN_TENANT_ICONS as Record<string, IconType>)[role] ?? UsersIcon;
}

/**
 * Resolves a display label for a (possibly unknown) external-integration
 * key. Unknown keys render as their raw key with underscores → spaces.
 *
 * @param key - The integration key (e.g. `"stripe"`).
 * @returns A human-readable label.
 */
export function labelForExternalId(key: string): string {
  const known = EXTERNAL_ID_LABELS[key];

  if (known) {
    return known;
  }

  return key.replaceAll("_", " ");
}

/**
 * Computes upper-case initials for a person's display name — the fallback
 * shown when their `avatar_url` is null (or fails to load).
 *
 * Handles multi-word names (`"Ada Lovelace"` → `"AL"`), single-word names
 * (`"Ada"` → `"A"`), and empty/whitespace input (`""` → `"?"`). Never
 * returns more than two letters so it fits inside the avatar tile.
 *
 * @param fullName - The person's display name.
 * @returns Up to two upper-case letters, or `"?"` when the name is empty.
 */
export function initialsFromName(fullName: string | null | undefined): string {
  if (!fullName) {
    return "?";
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }

  const first = parts[0]!.charAt(0);
  const last = parts[parts.length - 1]!.charAt(0);

  return `${first}${last}`.toUpperCase();
}
