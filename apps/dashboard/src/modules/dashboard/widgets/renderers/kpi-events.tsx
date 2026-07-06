/**
 * @file kpi-events.tsx
 * @module modules/dashboard/widgets/renderers/kpi-events
 *
 * @description
 * Overview widget: total scheduled events in the active branch and season.
 */

import { CalendarIcon } from "@academorix/ui/icons/outline";
import { KPI, Skeleton } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: events count. */
export default function KpiEventsWidget(): ReactNode {
  const { result, query } = useList({
    resource: "events",
    pagination: { currentPage: 1, pageSize: 1 },
  });

  const label = useResourceLabel("events", "Events");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <CalendarIcon />
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
