/**
 * @file kpi-teams.tsx
 * @module modules/dashboard/widgets/renderers/kpi-teams
 *
 * @description
 * Overview widget: total teams in the active branch and season.
 */

import { UserGroupIcon } from "@academorix/ui/icons/outline";
import { KPI, Skeleton } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: teams count. */
export default function KpiTeamsWidget(): ReactNode {
  const { result, query } = useList({
    resource: "teams",
    pagination: { currentPage: 1, pageSize: 1 },
  });

  const label = useResourceLabel("teams", "Teams");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <UserGroupIcon />
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
