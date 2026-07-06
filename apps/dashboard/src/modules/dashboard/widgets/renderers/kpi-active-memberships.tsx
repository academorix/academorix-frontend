/**
 * @file kpi-active-memberships.tsx
 * @module modules/dashboard/widgets/renderers/kpi-active-memberships
 *
 * @description
 * Overview widget: total memberships whose status is `active` in the active
 * branch. Passes a filter to `useList` so the row count reflects only the
 * live subset, not the entire membership history.
 */

import { CreditCardIcon } from "@academorix/ui/icons/outline";
import { KPI, Skeleton } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Overview widget: active memberships count. */
export default function KpiActiveMembershipsWidget(): ReactNode {
  const { result, query } = useList({
    resource: "memberships",
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: "status", operator: "eq", value: "active" }],
  });

  const label = useResourceLabel("memberships", "Active memberships");
  const total = result.total ?? 0;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <CreditCardIcon />
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
