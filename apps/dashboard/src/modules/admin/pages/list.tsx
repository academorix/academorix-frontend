/**
 * @file list.tsx
 * @module modules/admin/pages/list
 *
 * @description
 * The **Admin Console** hub — a landing page that indexes every
 * tenant-administration surface as a permission-gated card. The hub does
 * not own any data itself; it composes surfaces declared in
 * {@link "@/modules/admin/admin-surfaces.config"} and renders them grouped
 * by category (workspace → people → platform → compliance).
 *
 * Access to the hub is guarded through {@link ResourceAccessGuard}; access
 * to each *card* is a further permission check driven by the surface's
 * `requiredPermission`, so an operator sees only what they can actually use.
 */

import { Cog6ToothIcon } from "@stackra/ui/icons/heroicon/outline";
import { EmptyState } from "@stackra/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useMemo } from "react";

import type { AdminSurface, AdminSurfaceGroup } from "@/modules/admin/admin.types";
import type { Identity } from "@/types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { ViewHeader } from "@/components/refine/views/view-header";
import { AdminSurfaceCard } from "@/modules/admin/components/admin-surface-card";
import { ADMIN_SURFACE_GROUP_LABELS, ADMIN_SURFACE_GROUP_ORDER } from "@/modules/admin/admin.types";
import { groupVisibleSurfaces } from "@/modules/admin/admin-surfaces.config";

/**
 * The Admin Console landing page. Renders a permission-filtered grid of
 * surface cards grouped by category.
 */
export default function AdminHubPage(): ReactNode {
  // The identity supplies the permission set the grid filters against.
  // `useGetIdentity` is safe to call before permissions load — the guard
  // above and the empty-state below cover the "not ready" case.
  const { data: identity } = useGetIdentity<Identity>();
  const permissions = identity?.permissions ?? [];

  const groupedSurfaces = useMemo(() => groupVisibleSurfaces(permissions), [permissions]);

  // Only render groups that carry visible cards — an operator with a narrow
  // permission set does not need to see empty section headers.
  const nonEmptyGroups = ADMIN_SURFACE_GROUP_ORDER.filter(
    (group) => (groupedSurfaces[group] ?? []).length > 0,
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <ViewHeader title="Admin Console" />

      <ResourceAccessGuard action="list" resource="admin">
        <p className="text-sm text-muted">
          Configure the workspace, manage people and access, and inspect platform state. Cards
          appear only for surfaces you can act on.
        </p>

        {nonEmptyGroups.length === 0 ? (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Cog6ToothIcon />
              </EmptyState.Media>
              <EmptyState.Title>No admin surfaces available</EmptyState.Title>
              <EmptyState.Description>
                Your role does not grant access to any administration tools. Ask a workspace owner
                to grant the permission you need.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-8">
            {nonEmptyGroups.map((group) => (
              <AdminSurfaceSection
                key={group}
                group={group}
                surfaces={groupedSurfaces[group] ?? []}
              />
            ))}
          </div>
        )}
      </ResourceAccessGuard>
    </div>
  );
}

/** Props for {@link AdminSurfaceSection}. */
interface AdminSurfaceSectionProps {
  /** The section group key. */
  group: AdminSurfaceGroup;
  /** The visible surfaces in this group. */
  surfaces: readonly AdminSurface[];
}

/**
 * Renders one group of admin surface cards — a group heading followed by a
 * responsive grid of {@link AdminSurfaceCard}s.
 */
function AdminSurfaceSection({ group, surfaces }: AdminSurfaceSectionProps): ReactNode {
  return (
    <section aria-labelledby={`admin-surface-group-${group}`} className="flex flex-col gap-3">
      <h2
        className="text-xs font-medium tracking-wide text-muted uppercase"
        id={`admin-surface-group-${group}`}
      >
        {ADMIN_SURFACE_GROUP_LABELS[group]}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {surfaces.map((surface) => (
          <AdminSurfaceCard key={surface.id} surface={surface} />
        ))}
      </div>
    </section>
  );
}
