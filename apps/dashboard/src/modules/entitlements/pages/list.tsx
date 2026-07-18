/**
 * @file list.tsx
 * @module modules/entitlements/pages/list
 *
 * @description
 * The full **entitlements usage matrix** at `/usage`. Where the shell's
 * headline meters (`/me.quota_summary`) render 3-5 rows, this page reads
 * `GET /api/entitlements/usage` and renders every grant included in the
 * tenant's plan — grouped by grant `type` (slot / pool / feature) so an
 * admin can see slots (metered), pools (bucket), and features (booleans) at
 * a glance.
 *
 * @see BACKEND_HANDOFF.md §5.5 (`GET /api/entitlements/usage`)
 */

import {
  CheckCircleIcon,
  ChartPieIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@stackra/ui/icons/heroicon/outline";
import { Card, Chip, Separator, Spinner } from "@stackra/ui/react";

import type { EntitlementType, EntitlementUsage } from "@/types";
import type { IconType } from "@stackra/ui/icons";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { QuotaMeter } from "@/components/billing";
import { Breadcrumbs } from "@/components/refine";
import { useEntitlementsUsage } from "@/modules/entitlements/hooks/use-entitlements";

/** Section titles + icons per grant type. */
const SECTION_META: Record<
  EntitlementType,
  { title: string; description: string; Icon: IconType }
> = {
  slot: {
    title: "Metered slots",
    description: "Countable resources with a hard limit (athletes, branches, teams).",
    Icon: ChartPieIcon,
  },
  pool: {
    title: "Pools",
    description: "Bucket allowances refilled each billing period.",
    Icon: ChartPieIcon,
  },
  feature: {
    title: "Features",
    description: "Boolean capabilities enabled by your plan.",
    Icon: ShieldCheckIcon,
  },
};

/** Groups the usage matrix by grant type. */
function groupByType(rows: EntitlementUsage[]): Record<EntitlementType, EntitlementUsage[]> {
  return rows.reduce<Record<EntitlementType, EntitlementUsage[]>>(
    (accumulator, row) => {
      accumulator[row.type].push(row);

      return accumulator;
    },
    { slot: [], pool: [], feature: [] },
  );
}

/** Renders a slot/pool row — a labeled QuotaMeter card. */
function MeterRow({ row }: { row: EntitlementUsage }): ReactNode {
  // Unlimited grants: the shared QuotaMeter renders nothing when limit is null,
  // so we render a friendly "Unlimited" chip inline here instead.
  if (row.is_unlimited || row.limit === null) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-default bg-background p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{row.label}</span>
          <span className="text-xs text-muted">{row.used} in use</span>
        </div>
        <Chip color="success" size="sm" variant="soft">
          Unlimited
        </Chip>
      </div>
    );
  }

  return <QuotaMeter label={row.label} quotaKey={row.key} variant="card" />;
}

/** Renders a boolean feature row — a check/x icon + label. */
function FeatureRow({ row }: { row: EntitlementUsage }): ReactNode {
  // A `feature` grant with `limit === 0` (or explicitly unlimited: false with 0 used) is
  // effectively "off"; unlimited/`limit >= 1` is "on". Backend guarantees either
  // `is_unlimited: true` or `limit: 1` for enabled features.
  const isEnabled = row.is_unlimited || (row.limit !== null && row.limit >= 1);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-default bg-background p-4">
      {isEnabled ? (
        <CheckCircleIcon aria-hidden="true" className="size-5 shrink-0 text-success" />
      ) : (
        <XCircleIcon aria-hidden="true" className="size-5 shrink-0 text-muted" />
      )}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{row.label}</span>
        <span className="text-xs text-muted">{isEnabled ? "Enabled" : "Not included"}</span>
      </div>
    </div>
  );
}

/** Renders one section per grant type. */
function EntitlementSection({
  type,
  rows,
}: {
  type: EntitlementType;
  rows: EntitlementUsage[];
}): ReactNode {
  const meta = SECTION_META[type];
  const { Icon } = meta;

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Icon aria-hidden="true" className="size-5 text-accent" />
          <Card.Title>{meta.title}</Card.Title>
        </div>
        <Card.Description>{meta.description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) =>
            type === "feature" ? (
              <FeatureRow key={row.key} row={row} />
            ) : (
              <MeterRow key={row.key} row={row} />
            ),
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

/** The entitlements usage page. */
export default function EntitlementsUsagePage(): ReactNode {
  const { data, isLoading, error } = useEntitlementsUsage();

  const grouped = data ? groupByType(data) : null;
  const isEmpty = data !== null && data.length === 0;

  return (
    <ResourceAccessGuard action="list" resource="entitlements">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Usage &amp; limits</h1>
          <p className="text-sm text-muted">
            Everything included with your plan, and how much you&apos;ve used this period.
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error.message}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading entitlements" />
          </div>
        ) : isEmpty ? (
          <Card>
            <Card.Content>
              <p className="text-sm text-muted">
                Your plan doesn&apos;t include any entitlements yet. Choose a plan from the pricing
                page to activate quotas and features.
              </p>
            </Card.Content>
          </Card>
        ) : grouped ? (
          <>
            <EntitlementSection rows={grouped.slot} type="slot" />
            <EntitlementSection rows={grouped.pool} type="pool" />
            <EntitlementSection rows={grouped.feature} type="feature" />
          </>
        ) : null}
      </div>
    </ResourceAccessGuard>
  );
}
