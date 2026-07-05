/**
 * @file comparison-matrix.tsx
 * @module modules/billing/components/comparison-matrix
 *
 * @description
 * The feature-comparison table on the pricing page: one row per unique grant
 * across every plan, one column per plan, cell contents derived from the
 * plan's grant entry:
 *
 * - Boolean feature enabled → check icon
 * - Boolean feature missing → em-dash
 * - Metered slot with a limit → the number
 * - Metered slot marked unlimited → the "Unlimited" pill
 * - Row missing from a plan entirely → em-dash
 *
 * Rows are grouped by category (see `pricing-config.ts`) so a scrolling
 * reader can spot which section they're in. The plan-name row is sticky at
 * the top on scroll so the column context stays visible on long pages.
 */

import { CheckIcon, MinusIcon } from "@academorix/ui/icons/outline";

import type { ComparisonRow, GrantCategory } from "@/modules/billing/lib/pricing-config";
import type { PlanGrant, PlanTier } from "@/types";
import type { ReactNode } from "react";

import {
  buildComparisonRows,
  GRANT_CATEGORY_META,
  groupComparisonRowsByCategory,
  sortPlansForDisplay,
} from "@/modules/billing/lib/pricing-config";
import { PLAN_KEY_LABELS } from "@/types";

/** Props for {@link ComparisonMatrix}. */
export interface ComparisonMatrixProps {
  /** The plan catalog (any order — the component sorts for display). */
  plans: PlanTier[];
}

/**
 * Renders the plan-comparison matrix.
 *
 * The table is intentionally a native `<table>` (not a data-grid) — this is
 * static marketing content, so a11y benefits from the plain semantic markup
 * and there's no interactive sort/filter to hang off a headless table.
 */
export function ComparisonMatrix({ plans }: ComparisonMatrixProps): ReactNode {
  if (plans.length === 0) {
    return null;
  }

  const orderedPlans = sortPlansForDisplay(plans);
  const rows = buildComparisonRows(orderedPlans);
  const groups = groupComparisonRowsByCategory(rows);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">Compare features across plans</caption>

        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
          <tr className="border-b border-default">
            <th className="w-1/3 py-4 pr-4 text-sm font-semibold text-foreground" scope="col">
              Feature
            </th>
            {orderedPlans.map((plan) => (
              <th
                key={plan.key}
                className={`px-3 py-4 text-center text-sm font-semibold text-foreground ${
                  plan.is_popular ? "text-accent" : ""
                }`}
                scope="col"
              >
                {PLAN_KEY_LABELS[plan.key] ?? plan.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => (
            <CategoryRows
              key={group.category}
              category={group.category}
              plans={orderedPlans}
              rows={group.rows}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────

/** One category header + its comparison rows. */
function CategoryRows({
  category,
  plans,
  rows,
}: {
  category: GrantCategory;
  plans: PlanTier[];
  rows: ComparisonRow[];
}): ReactNode {
  const meta = GRANT_CATEGORY_META[category];
  const columnCount = plans.length + 1;

  return (
    <>
      <tr className="border-t-2 border-default">
        <th
          className="bg-default/20 py-3 pl-2 text-left text-xs font-semibold tracking-wide text-muted uppercase"
          colSpan={columnCount}
          scope="colgroup"
        >
          <span className="text-foreground">{meta.label}</span>
          <span className="ml-2 font-normal text-muted normal-case">{meta.description}</span>
        </th>
      </tr>
      {rows.map((row) => (
        <ComparisonMatrixRow key={row.key} plans={plans} row={row} />
      ))}
    </>
  );
}

/** One feature row across every plan. */
function ComparisonMatrixRow({ row, plans }: { row: ComparisonRow; plans: PlanTier[] }): ReactNode {
  return (
    <tr className="border-b border-default/60">
      <th className="py-3 pr-4 text-left align-top text-sm font-medium text-foreground" scope="row">
        {row.label}
      </th>
      {plans.map((plan) => (
        <td key={plan.key} className="px-3 py-3 text-center align-top text-sm">
          <ComparisonCell grant={plan.grants.find((entry) => entry.key === row.key)} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Renders a single cell: check for enabled features, number for metered
 * limits, "Unlimited" for uncapped grants, em-dash for missing.
 */
function ComparisonCell({ grant }: { grant: PlanGrant | undefined }): ReactNode {
  if (!grant) {
    return (
      <>
        <span className="sr-only">Not included</span>
        <MinusIcon aria-hidden="true" className="mx-auto size-4 text-muted" />
      </>
    );
  }

  if (grant.type === "feature") {
    if (grant.is_unlimited || (grant.limit !== null && grant.limit >= 1)) {
      return (
        <>
          <span className="sr-only">Included</span>
          <CheckIcon aria-hidden="true" className="mx-auto size-4 text-success" />
        </>
      );
    }

    return (
      <>
        <span className="sr-only">Not included</span>
        <MinusIcon aria-hidden="true" className="mx-auto size-4 text-muted" />
      </>
    );
  }

  // Slots + pools: render the numeric limit, or "Unlimited" when applicable.
  if (grant.is_unlimited || grant.limit === null) {
    return <span className="font-medium text-foreground">Unlimited</span>;
  }

  return <span className="text-foreground tabular-nums">{grant.limit.toLocaleString()}</span>;
}
