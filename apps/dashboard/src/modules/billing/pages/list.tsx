/**
 * @file list.tsx
 * @module modules/billing/pages/list
 *
 * @description
 * `/subscription` — the tabbed billing dashboard (§9). Tabs: Plan / Payment
 * method / Invoices / Usage. Read-only view; deep changes route to
 * `/settings/billing`.
 */

import { Breadcrumbs, Button, Card, Chip, Tabs } from "@heroui/react";
import { KPI, KPIGroup, Widget } from "@heroui-pro/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { BaseRecord } from "@refinedev/core";
import type { Key } from "react";

import { Iconify } from "@/icons/iconify";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/refine/format";

const PLAN_FEATURES = [
  { label: "Unlimited athletes", included: true },
  { label: "Multi-branch support", included: true },
  { label: "Advanced reporting", included: true },
  { label: "Priority support", included: true },
  { label: "SLA-backed uptime", included: false },
  { label: "Dedicated CSM", included: false },
];

export default function Page() {
  const [tab, setTab] = useState<Key>("plan");
  const { result: invoicesResult } = useList<BaseRecord>({
    resource: "invoices",
    pagination: { mode: "off" },
  });
  const invoices = (invoicesResult?.data ?? []) as (BaseRecord & {
    name: string;
    amount: number;
    status?: { text: string; color: "success" | "warning" | "danger" | "accent" | "default" };
    createdAt: string;
  })[];

  const openInvoices = invoices.filter((i) => i.status?.text !== "Paid").length;
  const paidThisPeriod = invoices
    .filter((i) => i.status?.text === "Paid")
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Subscription</Breadcrumbs.Item>
      </Breadcrumbs>

      <PageHeader
        actions={
          <Button
            onPress={() => (window.location.pathname = "/settings/billing")}
            variant="secondary"
          >
            <Iconify className="size-4" icon="gear" />
            Manage billing
          </Button>
        }
        description="Your plan, payment method, and billing history."
        title="Subscription"
      />

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Icon status="success">
              <Iconify icon="credit-card" />
            </KPI.Icon>
            <KPI.Title>Current plan</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <div className="text-3xl font-semibold text-foreground">Growth</div>
            <p className="mt-1 text-xs text-muted">$249 / mo · renews Nov 1</p>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Icon status="warning">
              <Iconify icon="hourglass" />
            </KPI.Icon>
            <KPI.Title>Open invoices</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value maximumFractionDigits={0} value={openInvoices} />
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Icon status="success">
              <Iconify icon="check" />
            </KPI.Icon>
            <KPI.Title>Paid this period</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value
              currency="USD"
              maximumFractionDigits={0}
              style="currency"
              value={paidThisPeriod}
            />
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <Tabs onSelectionChange={setTab} selectedKey={String(tab)} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Subscription sections">
            <Tabs.Tab id="plan">
              {/*
               * WHY the inline-flex wrapper: `Tabs.Tab` renders
               * children flush together (`crownPlan`) with no
               * built-in icon-to-label gap. A dedicated
               * `inline-flex gap-1.5` container inserts a 6px
               * gap without touching the parent layout — same
               * fix applied to every icon+label tab in the app.
               */}
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-4" icon="crown" />
                Plan
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="method">
              <Tabs.Separator />
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-4" icon="credit-card" />
                Payment method
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="invoices">
              <Tabs.Separator />
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-4" icon="receipt" />
                Invoices
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="usage">
              <Tabs.Separator />
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-4" icon="chart-line" />
                Usage
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-6" id="plan">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <Card.Header>
                <Card.Title>Growth plan</Card.Title>
                <Card.Description>
                  Best fit for multi-branch academies with 500+ athletes.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <ul className="flex flex-col gap-2 text-sm">
                  {PLAN_FEATURES.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-2">
                      <Iconify
                        className={
                          feature.included ? "size-4 text-success" : "size-4 text-muted opacity-40"
                        }
                        icon={feature.included ? "circle-check-fill" : "circle"}
                      />
                      <span className={feature.included ? "text-foreground" : "text-muted"}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card.Content>
              <Card.Footer>
                <Button variant="primary">
                  <Iconify className="size-4" icon="crown" />
                  Upgrade to Scale
                </Button>
                <Button variant="ghost">Compare plans</Button>
              </Card.Footer>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title>Billing cycle</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Billed</span>
                  <span className="text-foreground">Monthly</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Next charge</span>
                  <span className="text-foreground">Nov 1, 2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Amount</span>
                  <span className="text-foreground tabular-nums">$249.00</span>
                </div>
              </Card.Content>
            </Card>
          </div>
        </Tabs.Panel>

        <Tabs.Panel className="pt-6" id="method">
          <Card className="max-w-lg">
            <Card.Header>
              <Card.Title>Payment method</Card.Title>
              <Card.Description>Add or update the card we charge each cycle.</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-default text-foreground">
                    <Iconify className="size-5" icon="credit-card" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                    <p className="text-xs text-muted">Expires 12 / 2027</p>
                  </div>
                </div>
                <Chip color="success" size="sm" variant="soft">
                  <Chip.Label>Default</Chip.Label>
                </Chip>
              </div>
              <Button variant="secondary">
                <Iconify className="size-4" icon="plus" />
                Add card
              </Button>
            </Card.Content>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel className="pt-6" id="invoices">
          <Widget className="w-full">
            <Widget.Header>
              <Widget.Title>Recent invoices</Widget.Title>
              <Widget.Description>
                Every invoice we've raised for this subscription.
              </Widget.Description>
            </Widget.Header>
            <Widget.Content className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 8).map((invoice, idx) => (
                    <tr
                      key={String(invoice.id)}
                      className={idx === invoices.length - 1 ? "" : "border-b border-border"}
                    >
                      <td className="px-6 py-3 text-sm font-medium text-foreground">
                        {invoice.name}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-foreground tabular-nums">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-3">
                        {invoice.status ? (
                          <Chip color={invoice.status.color} size="sm" variant="soft">
                            <Chip.Label>{invoice.status.text}</Chip.Label>
                          </Chip>
                        ) : null}
                      </td>
                      <td className="px-6 py-3 text-xs text-muted tabular-nums">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button aria-label="Download" isIconOnly size="sm" variant="ghost">
                          <Iconify className="size-4" icon="arrow-down-to-line" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Widget.Content>
          </Widget>
        </Tabs.Panel>

        <Tabs.Panel className="pt-6" id="usage">
          <Card>
            <Card.Header>
              <Card.Title>Usage this period</Card.Title>
              <Card.Description>Live counters against your plan's limits.</Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted">
                Detailed usage lives on{" "}
                <a className="text-accent" href="/usage">
                  /usage
                </a>
                .
              </p>
            </Card.Content>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
