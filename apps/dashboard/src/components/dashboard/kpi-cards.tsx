/**
 * @file kpi-cards.tsx
 * @module components/dashboard/kpi-cards
 *
 * @description
 * The four-card KPI strip that sits above the widget grid (Section 4.1 step
 * 3). Each card uses HeroUI Pro's `KPI` compound with a sparkline drawn from
 * seven data points.
 */

import { KPI } from "@heroui-pro/react";
import { useMemo } from "react";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Iconify } from "@/icons/iconify";

const trendColor: Record<string, string> = {
  up: "var(--color-success)",
  down: "var(--color-danger)",
  neutral: "var(--color-accent)",
};

const iconStatus: Record<string, "success" | "warning" | "danger" | undefined> = {
  up: "success",
  down: "danger",
  neutral: undefined,
};

function kpiValueStyle(
  id: string,
  currency: string | undefined,
): "currency" | "percent" | "decimal" {
  if (currency) return "currency";
  if (id === "attendance-rate") return "percent";

  return "decimal";
}

export function KpiCards() {
  const { data } = useDashboardData();
  const kpis = data?.kpis ?? [];

  /**
   * Pre-shape the sparkline data once per successful data load.
   *
   * `KPI.Chart` wraps a recharts `ResponsiveContainer` that runs a
   * `useEffect` on `data` identity — passing a fresh array literal
   * per render (`series.map(value => ({value}))` on the fly)
   * triggers a `setState` inside `ChartDataContextProvider` and,
   * combined with a parent re-render, blows past React 19's
   * max-update-depth guard. The `useMemo` freezes the reference so
   * the chart stays stable until the fixture actually changes
   * (which, in practice, is once per page load).
   */
  const chartSeries = useMemo<Record<string, ReadonlyArray<{ value: number }>>>(
    () => Object.fromEntries(kpis.map((kpi) => [kpi.id, kpi.series.map((value) => ({ value }))])),
    [kpis],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const style = kpiValueStyle(kpi.id, kpi.currency);

        return (
          <KPI key={kpi.id}>
            <KPI.Header>
              <KPI.Icon status={iconStatus[kpi.trend]}>
                <Iconify icon={kpi.icon} />
              </KPI.Icon>
              <KPI.Title>{kpi.title}</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              <KPI.Value
                currency={kpi.currency}
                maximumFractionDigits={style === "percent" ? 0 : 0}
                style={style}
                value={kpi.value}
              />
              <KPI.Trend trend={kpi.trend}>{kpi.change}</KPI.Trend>
            </KPI.Content>
            <KPI.Chart
              color={trendColor[kpi.trend]}
              data={chartSeries[kpi.id] as Array<{ value: number }>}
              height={52}
            />
          </KPI>
        );
      })}
    </div>
  );
}
