/**
 * @file show.tsx
 * @module modules/reports/pages/show
 *
 * @description
 * The `/reports/:id` detail surface (§10). Layout:
 *
 * - Breadcrumbs → Home / Reports / <report name>
 * - Header with title on the left and a `Run` primary button + overflow menu
 *   (Export CSV, Export PDF, Duplicate, Share, Delete) on the right.
 * - Two-column body: main column with three `Widget` blocks (bar / line / pie
 *   charts on placeholder data) and a `FloatingToc` in the right rail.
 * - A trailing narrative paragraph.
 *
 * The show page is read-only — the manifest sets `crud: "read-only"`.
 */

import { Breadcrumbs, Button, Chip, Dropdown, Label, Skeleton } from "@heroui/react";
import {
  BarChart,
  ChartTooltip,
  FloatingToc,
  LineChart,
  PieChart,
  Widget,
} from "@heroui-pro/react";
import { useNotification, useShow } from "@refinedev/core";
import { useState } from "react";

import type { BaseRecord } from "@refinedev/core";

import { Iconify } from "@/icons/iconify";
import { formatDate } from "@/refine/format";

type SavedReport = BaseRecord & {
  name?: string;
  owner?: { name?: string; avatar?: string };
  lastRunAt?: string;
  schedule?: { text: string; color: "accent" | "default" };
  share?: { text: string; color: "success" | "default" };
  template?: string;
  description?: string;
  createdAt?: string;
};

// -----------------------------------------------------------------------------
// Placeholder chart data — a builder pass would derive these from the report's
// query. For now we bake reasonable-looking numbers so the layout ships intact.
// -----------------------------------------------------------------------------

const REVENUE_BY_MONTH = [
  { month: "May", revenue: 42800 },
  { month: "Jun", revenue: 51200 },
  { month: "Jul", revenue: 47600 },
  { month: "Aug", revenue: 55400 },
  { month: "Sep", revenue: 61300 },
  { month: "Oct", revenue: 58900 },
];

const ATTENDANCE_TREND = [
  { week: "W1", rate: 78 },
  { week: "W2", rate: 82 },
  { week: "W3", rate: 85 },
  { week: "W4", rate: 81 },
  { week: "W5", rate: 88 },
  { week: "W6", rate: 90 },
  { week: "W7", rate: 87 },
  { week: "W8", rate: 92 },
];

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const SPORT_MIX = [
  { name: "Football", value: 42 },
  { name: "Basketball", value: 26 },
  { name: "Swimming", value: 18 },
  { name: "Tennis", value: 14 },
];

// -----------------------------------------------------------------------------
// Section anchors used by the FloatingToc. The `id` doubles as the `<section>`
// id, so scroll-into-view works with a plain anchor click.
// -----------------------------------------------------------------------------

const TOC_SECTIONS = [
  { id: "revenue", label: "Revenue trend" },
  { id: "attendance", label: "Attendance rate" },
  { id: "sport-mix", label: "Registration mix" },
  { id: "narrative", label: "Narrative" },
];

const OVERFLOW_ACTIONS = [
  { id: "export-csv", label: "Export CSV", icon: "arrow-down-to-line" },
  { id: "export-pdf", label: "Export PDF", icon: "file" },
  { id: "duplicate", label: "Duplicate", icon: "copy" },
  { id: "share", label: "Share", icon: "arrow-up-from-square" },
  { id: "delete", label: "Delete", icon: "trash-bin", variant: "danger" as const },
];

export default function Page() {
  const { query, result } = useShow<SavedReport>({ resource: "reports" });
  const { open: notify } = useNotification();
  const [activeId, setActiveId] = useState(TOC_SECTIONS[0]!.id);

  const record = (result ?? undefined) as SavedReport | undefined;
  const isLoading = query.isLoading;
  const title = record?.name ?? "Report";

  const notifyAction = (action: string) =>
    notify?.({
      key: `report-show-${action}`,
      message: `${action.charAt(0).toUpperCase()}${action.slice(1).replace(/-/g, " ")} scheduled`,
      description: "You'll get a toast when it's ready.",
      type: "success",
    });

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;

    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/reports">Reports</Breadcrumbs.Item>
        <Breadcrumbs.Item>{isLoading ? "Loading…" : title}</Breadcrumbs.Item>
      </Breadcrumbs>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isLoading ? <Skeleton className="inline-block h-7 w-64 rounded-md" /> : title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {isLoading ? (
              <Skeleton className="inline-block h-4 w-56 rounded-md" />
            ) : (
              <>
                {record?.owner?.name ? <span>Owned by {record.owner.name}</span> : null}
                {record?.lastRunAt ? <span>· Last run {formatDate(record.lastRunAt)}</span> : null}
              </>
            )}
          </p>
          {!isLoading && (record?.schedule || record?.share) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {record?.schedule ? (
                <Chip color={record.schedule.color} size="sm" variant="soft">
                  <Iconify className="size-3" icon="clock" />
                  <Chip.Label>{record.schedule.text}</Chip.Label>
                </Chip>
              ) : null}
              {record?.share ? (
                <Chip color={record.share.color} size="sm" variant="soft">
                  <Iconify
                    className="size-3"
                    icon={record.share.color === "success" ? "persons" : "lock"}
                  />
                  <Chip.Label>{record.share.text}</Chip.Label>
                </Chip>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onPress={() => notifyAction("run")} variant="primary">
            <Iconify className="size-4" icon="play" />
            Run
          </Button>
          <Dropdown>
            <Button aria-label="More actions" isIconOnly size="md" variant="ghost">
              <Iconify className="size-4" icon="ellipsis" />
            </Button>
            <Dropdown.Popover className="min-w-44" placement="bottom end">
              <Dropdown.Menu onAction={(key) => notifyAction(String(key))}>
                {OVERFLOW_ACTIONS.map((action) => (
                  <Dropdown.Item
                    key={action.id}
                    id={action.id}
                    textValue={action.label}
                    variant={action.variant === "danger" ? "danger" : undefined}
                  >
                    <Iconify className="size-4" icon={action.icon} />
                    <Label>{action.label}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>

      {/* Two-column body */}
      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column — three Widget blocks */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section id="revenue" className="scroll-mt-24">
            <Widget className="w-full">
              <Widget.Header>
                <div className="flex flex-col">
                  <Widget.Title>Revenue trend</Widget.Title>
                  <Widget.Description>Gross revenue by month, last 6 months</Widget.Description>
                </div>
                <Widget.Legend>
                  <Widget.LegendItem color="var(--chart-1)">Revenue</Widget.LegendItem>
                </Widget.Legend>
              </Widget.Header>
              <Widget.Content>
                <BarChart data={REVENUE_BY_MONTH} height={240}>
                  <BarChart.Grid vertical={false} />
                  <BarChart.XAxis dataKey="month" tickMargin={8} />
                  <BarChart.YAxis
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    width={44}
                  />
                  <BarChart.Bar
                    barSize={28}
                    dataKey="revenue"
                    fill="var(--chart-1)"
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
                              <ChartTooltip.Label>Revenue</ChartTooltip.Label>
                              <ChartTooltip.Value>
                                ${Number(entry.value).toLocaleString()}
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
          </section>

          <section id="attendance" className="scroll-mt-24">
            <Widget className="w-full">
              <Widget.Header>
                <div className="flex flex-col">
                  <Widget.Title>Attendance rate</Widget.Title>
                  <Widget.Description>Weekly attendance percentage</Widget.Description>
                </div>
                <Widget.Legend>
                  <Widget.LegendItem color="var(--chart-3)">Attendance %</Widget.LegendItem>
                </Widget.Legend>
              </Widget.Header>
              <Widget.Content>
                <LineChart data={ATTENDANCE_TREND} height={240}>
                  <LineChart.Grid vertical={false} />
                  <LineChart.XAxis dataKey="week" tickMargin={8} />
                  <LineChart.YAxis
                    domain={[60, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    width={40}
                  />
                  <LineChart.Line
                    dataKey="rate"
                    dot={false}
                    name="Attendance"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <LineChart.Tooltip
                    content={({ active, label, payload }) => {
                      if (!active || !payload?.length) return null;

                      return (
                        <ChartTooltip>
                          <ChartTooltip.Header>{label}</ChartTooltip.Header>
                          {payload.map((entry) => (
                            <ChartTooltip.Item key={String(entry.dataKey)}>
                              <ChartTooltip.Indicator color={entry.color ?? entry.stroke} />
                              <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
                              <ChartTooltip.Value>{Number(entry.value)}%</ChartTooltip.Value>
                            </ChartTooltip.Item>
                          ))}
                        </ChartTooltip>
                      );
                    }}
                  />
                </LineChart>
              </Widget.Content>
            </Widget>
          </section>

          <section id="sport-mix" className="scroll-mt-24">
            <Widget className="w-full">
              <Widget.Header>
                <div className="flex flex-col">
                  <Widget.Title>Registration mix</Widget.Title>
                  <Widget.Description>Share of active registrations by sport</Widget.Description>
                </div>
              </Widget.Header>
              <Widget.Content className="flex flex-col items-center gap-4">
                <PieChart height={220}>
                  <PieChart.Pie
                    cx="50%"
                    cy="50%"
                    data={SPORT_MIX}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={88}
                  >
                    {SPORT_MIX.map((_, idx) => (
                      <PieChart.Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </PieChart.Pie>
                  <PieChart.Tooltip
                    content={({ active, payload }) => {
                      const entry = payload?.[0];

                      if (!active || !entry) return null;

                      return (
                        <ChartTooltip>
                          <ChartTooltip.Item>
                            <ChartTooltip.Indicator color={entry.payload?.fill} />
                            <ChartTooltip.Label>{String(entry.name)}</ChartTooltip.Label>
                            <ChartTooltip.Value>{entry.value}%</ChartTooltip.Value>
                          </ChartTooltip.Item>
                        </ChartTooltip>
                      );
                    }}
                  />
                </PieChart>
                <Widget.Legend className="flex-wrap justify-center">
                  {SPORT_MIX.map((entry, idx) => (
                    <Widget.LegendItem
                      key={entry.name}
                      color={PIE_COLORS[idx % PIE_COLORS.length]!}
                    >
                      {entry.name}
                    </Widget.LegendItem>
                  ))}
                </Widget.Legend>
              </Widget.Content>
            </Widget>
          </section>
        </div>

        {/* Side rail — FloatingToc */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FloatingToc>
              <FloatingToc.Trigger aria-label="Report sections">
                {TOC_SECTIONS.map((section) => (
                  <FloatingToc.Bar key={section.id} active={section.id === activeId} />
                ))}
              </FloatingToc.Trigger>
              <FloatingToc.Content>
                <span className="mb-1 block px-3 py-1 text-[10px] font-semibold tracking-widest text-muted uppercase">
                  In this report
                </span>
                {TOC_SECTIONS.map((section) => (
                  <FloatingToc.Item
                    key={section.id}
                    active={section.id === activeId}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.label}
                  </FloatingToc.Item>
                ))}
              </FloatingToc.Content>
            </FloatingToc>
          </div>
        </aside>
      </div>

      {/* Trailing narrative */}
      <section id="narrative" className="scroll-mt-24">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Narrative</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </>
            ) : (
              <>
                <p>{record?.description ?? "This report has no narrative yet."}</p>
                <p>
                  The three widgets above summarise the metrics that matter for this cohort. Numbers
                  update on the report's schedule; open a widget's menu to jump into the underlying
                  listing with the same filters applied.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
