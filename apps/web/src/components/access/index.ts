/**
 * @file index.ts
 * @module components/access
 *
 * @description
 * Public barrel for RBAC UI helpers — the {@link ResourceAccessGuard} page
 * guard and the {@link AccessDenied} empty state, both built on Refine's
 * `useCan` hook and the app's access-control provider.
 */

export { AccessDenied, ResourceAccessGuard } from "@/components/access/access-guard";
export type { ResourceAction } from "@/components/access/access-guard";
