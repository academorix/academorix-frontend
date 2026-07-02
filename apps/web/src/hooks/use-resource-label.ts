/**
 * @file use-resource-label.ts
 * @module hooks/use-resource-label
 *
 * @description
 * Resolves a resource's **display label** for the current tenant. A resource
 * has a canonical name (e.g. `athletes`) but its label is tenant-driven: the
 * `terminology` map returned by `/auth/me` can override it (an academy tenant
 * may show "Students", a gym "Members"). Falls back to the provided default.
 *
 * Reactive via `useGetIdentity`, so labels settle once the bootstrap manifest
 * loads.
 */

import { useGetIdentity } from "@refinedev/core";

import type { Identity } from "@/types";

/**
 * Returns the tenant-specific label for a resource.
 *
 * @param resourceName - Canonical resource name (e.g. `"athletes"`).
 * @param fallback - Default label when the tenant defines no override.
 */
export function useResourceLabel(resourceName: string, fallback: string): string {
  const { data: identity } = useGetIdentity<Identity>();

  return identity?.terminology?.[resourceName] ?? fallback;
}
