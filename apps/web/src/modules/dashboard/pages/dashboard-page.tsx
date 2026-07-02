/**
 * @file dashboard-page.tsx
 * @module modules/dashboard/pages/dashboard-page
 *
 * @description
 * The authenticated landing surface. KPI cards derive their counts from the
 * data layer itself — each issues a `useList` with `pageSize: 1` and reads
 * `result.total`, so numbers are real in both mock and REST modes without a
 * bespoke stats endpoint. Labels use tenant terminology (an academy shows
 * "Students" for the `athletes` resource).
 */

import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  UsersIcon,
} from "@academorix/ui/icons/outline";
import { Card, Spinner } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { ComponentType, ReactNode, SVGProps } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Declarative KPI definition. */
interface KpiConfig {
  /** Canonical resource whose row count is displayed. */
  resource: string;
  /** Default label (overridden by tenant terminology). */
  label: string;
  /** Glyph rendered in the card corner. */
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** The KPIs shown on the dashboard, in display order. */
const KPIS: KpiConfig[] = [
  { resource: "athletes", label: "Athletes", Icon: AcademicCapIcon },
  { resource: "coaches", label: "Coaches", Icon: UsersIcon },
  { resource: "courses", label: "Courses", Icon: BookOpenIcon },
  { resource: "teams", label: "Teams", Icon: UserGroupIcon },
];

/** A single KPI card — resolves its count from the data provider. */
function KpiCard({ resource, label, Icon }: KpiConfig): ReactNode {
  const { result, query } = useList({
    resource,
    pagination: { currentPage: 1, pageSize: 1 },
  });

  const displayLabel = useResourceLabel(resource, label);
  const total = result.total ?? 0;
  const isLoading = query.isLoading;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Description>{displayLabel}</Card.Description>
          <Icon aria-hidden="true" className="size-5 text-muted" />
        </div>
        <Card.Title className="text-3xl tabular-nums">
          {isLoading ? <Spinner size="sm" /> : total}
        </Card.Title>
      </Card.Header>
    </Card>
  );
}

/** The dashboard page: heading + KPI grid. */
export default function DashboardPage(): ReactNode {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">An overview of your academy.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.resource} Icon={kpi.Icon} label={kpi.label} resource={kpi.resource} />
        ))}
      </div>
    </div>
  );
}
