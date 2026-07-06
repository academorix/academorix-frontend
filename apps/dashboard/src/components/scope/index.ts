/**
 * @file index.ts
 * @module components/scope
 *
 * @description
 * Barrel for the scope switchers rendered in the authenticated shell:
 * organization, branch, and season. Each is data-driven from the identity's
 * allowed scopes and degrades to a read-only indicator when there is only one
 * option.
 *
 * The tenant (workspace) switcher lives in `@/lib/tenancy` as
 * `WorkspaceSwitcher` — cross-tenant switching is a tenancy concern, not a
 * scope-inside-a-tenant concern, so it is co-located with the tenancy
 * primitives.
 */

export { OrganizationSwitcher } from "@/components/scope/organization-switcher";
export { BranchSwitcher } from "@/components/scope/branch-switcher";
export { SeasonSwitcher } from "@/components/scope/season-switcher";
