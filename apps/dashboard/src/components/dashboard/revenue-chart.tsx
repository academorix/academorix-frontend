/**
 * @file revenue-chart.tsx
 * @module components/dashboard/revenue-chart
 *
 * @description
 * The 7-day revenue trend widget (Section 4.5 `chart-revenue-90d` — shortened
 * to a week here so the demo fixture is legible). Composes HeroUI Pro
 * `Widget` + `AreaChart` + `ChartTooltip`.
 */

import { AreaChart, ChartTooltip, Widget } from "@heroui-pro/react";

import { useDashboardData } from "@/hooks/use-dashboard-data";

export function RevenueChart() {
  const { data } = useDashboardData();
  const revenueSeries = data?.revenueSeries ?? [];

  return (
    <Widget className="w-full">
      <Widget.Header>
        <div className="flex flex-col">
          <Widget.Title>Revenue this week</Widget.Title>
          <Widget.Description>Gross revenue across every branch</Widget.Description>
        </div>
        <Widget.Legend>
          <Widget.LegendItem color="var(--chart-1)">Revenue</Widget.LegendItem>
        </Widget.Legend>
      </Widget.Header>
      <Widget.Content>
        {/*
          Cast-through-unknown same reason as `discipline-chart.tsx` —
          our typed `RevenuePoint[]` is a subset of the chart's
          permissive `Record<string, string | number>[]` data type.
        */}
        <AreaChart
          data={revenueSeries as unknown as Record<string, string | number>[]}
          height={264}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <AreaChart.Grid vertical={false} />
          <AreaChart.XAxis dataKey="day" tickMargin={8} />
          <AreaChart.YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} width={44} />
          <AreaChart.Area
            dataKey="revenue"
            dot={false}
            fill="url(#revenue-fill)"
            isAnimationActive={false}
            name="Revenue"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
          />
          <AreaChart.Tooltip
            content={({ active, label, payload }) => {
              if (!active || !payload?.length) return null;

              return (
                <ChartTooltip>
                  <ChartTooltip.Header>{label}</ChartTooltip.Header>
                  {payload.map((entry) => (
                    <ChartTooltip.Item key={String(entry.dataKey)}>
                      <ChartTooltip.Indicator color={entry.color ?? entry.stroke} />
                      <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
                      <ChartTooltip.Value>
                        ${Number(entry.value).toLocaleString()}
                      </ChartTooltip.Value>
                    </ChartTooltip.Item>
                  ))}
                </ChartTooltip>
              );
            }}
          />
        </AreaChart>
      </Widget.Content>
    </Widget>
  );
}
