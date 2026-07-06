/**
 * @file kpi-coaches.tsx
 * @module modules/dashboard/widgets/renderers/kpi-coaches
 *
 * @description
 * Overview widget: total coaches in the active scope. Uses the same
 * `useList` row-count pattern as the athletes KPI.
 */

import { UserIcon } from "@academorix/ui/icons/outline";
import { KPI, Skeleton } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: coaches count. */
export default function KpiCoachesWidget(): ReactNode {
  const { result, query } = useList({
    resource: "coaches",
    pagination: { currentPage: 1, pageSize: 1 },
  });

  const label = useResourceLabel("coaches", "Coaches");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <UserIcon />
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
