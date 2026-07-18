/**
 * @file kpi-active-branches.tsx
 * @module modules/dashboard/widgets/renderers/kpi-active-branches
 *
 * @description
 * Overview widget: total branches whose status is `active` in the active
 * organization. Useful for multi-branch networks; single-branch tenants can
 * hide the widget through the picker.
 */

import { BuildingStorefrontIcon } from "@stackra/ui/icons/heroicon/outline";
import { KPI, Skeleton } from "@stackra/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: active branches count. */
export default function KpiActiveBranchesWidget(): ReactNode {
  const { result, query } = useList({
    resource: "branches",
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: "status", operator: "eq", value: "active" }],
  });

  const label = useResourceLabel("branches", "Active branches");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <BuildingStorefrontIcon />
        </KPI.Icon>
        <KPI.Title>{label}</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        {query.isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <KPI.Value maximumFractionDigits={0} value={total} />
        )}
      </KPI.Content>
    </KPI>
  );
}
