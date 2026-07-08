/**
 * @file index.ts
 * @module lib/tenancy
 *
 * @description
 * Public barrel for the tenancy layer: types + the workspace-scoped provider
 * and hooks. Import through this module rather than reaching into individual
 * files, e.g.:
 *
 * @example
 * ```tsx
 * import {
 *   TenancyProvider,
 *   useTenancy,
 *   useMyWorkspaces,
 *   bootstrapBrandingFromCache,
 * } from "@/lib/tenancy";
 * ```
 */

export type {
  TenancyContextValue,
  TenantWorkspace,
  WorkspaceListEntry,
} from "@/lib/tenancy/tenancy.types";
export { TenancyProvider, useTenancy } from "@/lib/tenancy/tenant-context";
export { useMyWorkspaces } from "@/lib/tenancy/use-workspaces";
export type { UseMyWorkspacesResult } from "@/lib/tenancy/use-workspaces";
export { WorkspaceSwitcher } from "@/lib/tenancy/workspace-switcher";

// Branding — the DOM-write layer that paints the tenant palette on `<html>`.
export {
  applyBrandingToDom,
  brandingToCssVars,
  hexToOklch,
  readableForegroundFor,
} from "@/lib/tenancy/branding";
export type { OklchColor } from "@/lib/tenancy/branding";
export {
  clearCachedBranding,
  readCachedBranding,
  writeCachedBranding,
} from "@/lib/tenancy/branding-cache";
export type { CachedBranding } from "@/lib/tenancy/branding-cache";
export { bootstrapBrandingFromCache } from "@/lib/tenancy/branding-boot";

// Splash + fallback surfaces the provider renders before the tree runs.
export { TenantNotFoundPage } from "@/lib/tenancy/tenant-not-found";
