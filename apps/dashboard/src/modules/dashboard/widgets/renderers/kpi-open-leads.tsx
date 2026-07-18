/**
 * @file kpi-open-leads.tsx
 * @module modules/dashboard/widgets/renderers/kpi-open-leads
 *
 * @description
 * Overview widget: leads that are still in the pipeline (not won, not lost).
 * Uses an `nin` filter on the stage field.
 */

import { UserPlusIcon } from "@stackra/ui/icons/heroicon/outline";
import { KPI, Skeleton } from "@stackra/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: open leads count. */
export default function KpiOpenLeadsWidget(): ReactNode {
  const { result, query } = useList({
    resource: "leads",
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: "stage", operator: "nin", value: ["won", "lost"] }],
  });

  const label = useResourceLabel("leads", "Open leads");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="warning">
          <UserPlusIcon />
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
