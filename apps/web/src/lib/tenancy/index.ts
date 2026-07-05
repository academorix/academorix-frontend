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
 * import { TenancyProvider, useTenancy, useMyWorkspaces } from "@/lib/tenancy";
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
