/**
 * @file kpi-athletes.tsx
 * @module modules/dashboard/widgets/renderers/kpi-athletes
 *
 * @description
 * Overview widget: total athletes in the active scope. Reads the row count
 * from Refine's `useList` with `pageSize: 1` and renders a `KPI` card in the
 * tenant's terminology (an academy sees "Students", a club sees "Members").
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { KPI, Skeleton } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: athletes count. */
export default function KpiAthletesWidget(): ReactNode {
  const { result, query } = useList({
    resource: "athletes",
    pagination: { currentPage: 1, pageSize: 1 },
  });

  const label = useResourceLabel("athletes", "Athletes");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <AcademicCapIcon />
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
