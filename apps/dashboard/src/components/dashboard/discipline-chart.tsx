/**
 * @file discipline-chart.tsx
 * @module components/dashboard/discipline-chart
 *
 * @description
 * Athletes-per-discipline widget (Section 4.5 `chart-revenue-per-sport` sibling
 * — showing headcount instead of revenue for the demo).
 */

import { BarChart, ChartTooltip, Widget } from "@heroui-pro/react";

import { useDashboardData } from "@/hooks/use-dashboard-data";

export function DisciplineChart() {
  const { data } = useDashboardData();
  const disciplineSeries = data?.disciplineSeries ?? [];

  return (
    <Widget className="w-full">
      <Widget.Header>
        <div className="flex flex-col">
          <Widget.Title>Athletes per sport</Widget.Title>
          <Widget.Description>Active registrations by discipline</Widget.Description>
        </div>
      </Widget.Header>
      <Widget.Content>
        {/*
          HeroUI Pro's BarChart types data as a permissive
          `Record<string, string | number>[]` — our typed
          `DisciplinePoint[]` is a proper subset. Cast through
          `unknown` to satisfy the type parameter without weakening
          the source-side type.
        */}
        <BarChart
          data={disciplineSeries as unknown as Record<string, string | number>[]}
          height={264}
        >
          <BarChart.Grid vertical={false} />
          <BarChart.XAxis dataKey="discipline" tickMargin={8} />
          <BarChart.YAxis width={36} />
          <BarChart.Bar
            barSize={26}
            dataKey="athletes"
            fill="var(--accent)"
            isAnimationActive={false}
            radius={[8, 8, 0, 0]}
          />
          <BarChart.Tooltip
            content={({ active, label, payload }) => {
              if (!active || !payload?.length) return null;

              return (
                <ChartTooltip>
                  <ChartTooltip.Header>{label}</ChartTooltip.Header>
                  {payload.map((entry) => (
                    <ChartTooltip.Item key={String(entry.dataKey)}>
                      <ChartTooltip.Indicator color={entry.color ?? entry.fill} />
                      <ChartTooltip.Label>Athletes</ChartTooltip.Label>
                      <ChartTooltip.Value>
                        {Number(entry.value).toLocaleString()}
                      </ChartTooltip.Value>
                    </ChartTooltip.Item>
                  ))}
                </ChartTooltip>
              );
            }}
          />
        </BarChart>
      </Widget.Content>
    </Widget>
  );
}
