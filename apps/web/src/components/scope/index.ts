/**
 * @file index.ts
 * @module components/scope
 *
 * @description
 * Barrel for the scope switchers rendered in the authenticated shell:
 * tenant, organization, branch, and season. Each is data-driven from the
 * identity's allowed scopes and degrades to a read-only indicator when there is
 * only one option.
 */

export { TenantSwitcher } from "@/components/scope/tenant-switcher";
export { OrganizationSwitcher } from "@/components/scope/organization-switcher";
export { BranchSwitcher } from "@/components/scope/branch-switcher";
export { SeasonSwitcher } from "@/components/scope/season-switcher";
