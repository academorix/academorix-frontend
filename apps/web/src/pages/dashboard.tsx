/**
 * @file dashboard.tsx
 * @module pages/dashboard
 *
 * @description
 * The authenticated landing surface. Renders KPI cards whose counts come from
 * the data layer itself — each card issues a `useList` with `pageSize: 1` and
 * reads `total` from the response, so the numbers are real in both mock and
 * REST modes without a bespoke stats endpoint.
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

/** Declarative KPI definition. */
interface KpiConfig {
  /** Resource whose row count is displayed. */
  resource: string;
  /** Human-readable label. */
  label: string;
  /** Glyph rendered in the card corner. */
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** The KPIs shown on the dashboard, in display order. */
const KPIS: KpiConfig[] = [
  { resource: "students", label: "Students", Icon: AcademicCapIcon },
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

  const total = result.total ?? 0;
  const isLoading = query.isLoading;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Description>{label}</Card.Description>
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
export function DashboardPage(): ReactNode {
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
