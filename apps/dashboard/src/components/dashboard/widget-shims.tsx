/**
 * @file widget-shims.tsx
 * @module components/dashboard/widget-shims
 *
 * @description
 * Small-tile widgets that don't have a bespoke implementation yet. Each is a
 * `Widget` shell with a KPI-like body and a `demo` chip so it's obvious the
 * widget is wired against fixtures, not the backend.
 */

import { Chip } from "@heroui/react";
import { Widget } from "@heroui-pro/react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

type Intent = "default" | "success" | "warning" | "danger";
type SmallKpiProps = {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  intent?: Intent;
};

const INTENT_COLOR: Record<Intent, "accent" | "success" | "warning" | "danger" | "default"> = {
  default: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
};

function SmallKpiWidget({
  title,
  value,
  icon,
  trend,
  intent = "default",
}: SmallKpiProps): ReactNode {
  return (
    <Widget className="w-full">
      <Widget.Header>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-surface-secondary text-muted"
          >
            <Iconify className="size-4" icon={icon} />
          </span>
          <Widget.Title>{title}</Widget.Title>
        </div>
        <Chip color={INTENT_COLOR[intent]} size="sm" variant="soft">
          <Chip.Label>demo</Chip.Label>
        </Chip>
      </Widget.Header>
      <Widget.Content>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold text-foreground tabular-nums">{value}</span>
          {trend ? <span className="text-xs text-muted">{trend}</span> : null}
        </div>
      </Widget.Content>
    </Widget>
  );
}

export function KpiAthletesWidget() {
  return <SmallKpiWidget icon="person" title="Athletes" trend="+18 this week" value="428" />;
}

export function KpiRevenueMtdWidget() {
  return (
    <SmallKpiWidget
      icon="circle-dollar"
      intent="success"
      title="Revenue MTD"
      trend="+12.4%"
      value="$82,400"
    />
  );
}

export function KpiAttendanceRateWidget() {
  return (
    <SmallKpiWidget
      icon="square-check"
      intent="success"
      title="Attendance rate"
      trend="+1.4 pts"
      value="93%"
    />
  );
}

export function KpiOpenLeadsWidget() {
  return (
    <SmallKpiWidget icon="funnel" title="Open leads" trend="Assigned to 3 owners" value="24" />
  );
}

export function MoneyOutstandingWidget() {
  return (
    <SmallKpiWidget
      icon="receipt"
      intent="warning"
      title="Outstanding"
      trend="8 invoices unpaid"
      value="$4,120"
    />
  );
}

export function MoneyRefundsMtdWidget() {
  return (
    <SmallKpiWidget
      icon="arrow-uturn-cw-right"
      intent="danger"
      title="Refunds MTD"
      trend="2 refunds issued"
      value="$320"
    />
  );
}

export function MoneyForecastWidget() {
  return (
    <SmallKpiWidget
      icon="chart-line"
      title="Forecast · 30 days"
      trend="Based on scheduled bills"
      value="$96,800"
    />
  );
}

export function CredentialsExpiringWidget() {
  return (
    <SmallKpiWidget
      icon="key"
      intent="warning"
      title="Credentials expiring"
      trend="Within 60 days"
      value="6"
    />
  );
}

export function DocumentsMissingWidget() {
  return (
    <SmallKpiWidget
      icon="folder"
      intent="warning"
      title="Documents missing"
      trend="Required"
      value="11"
    />
  );
}

export function SafeguardingTrainingWidget() {
  return (
    <SmallKpiWidget
      icon="shield-check"
      intent="success"
      title="Safeguarding training"
      trend="Staff current"
      value="94%"
    />
  );
}

export function BirthdaysWidget() {
  return (
    <SmallKpiWidget icon="star" title="Birthdays this week" trend="3 athletes, 1 staff" value="4" />
  );
}

export function NewAthletesWidget() {
  return (
    <SmallKpiWidget
      icon="person-plus"
      intent="success"
      title="New athletes · 30d"
      trend="+18 registrations"
      value="18"
    />
  );
}
