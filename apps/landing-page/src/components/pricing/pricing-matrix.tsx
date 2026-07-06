/**
 * @file pricing-matrix.tsx
 * @module components/pricing/pricing-matrix
 *
 * @description
 * The deep feature-comparison matrix. Client Component so the SearchField is
 * live. Consumes hydrated `plans` + `sections` from the Server Component
 * page — no filesystem or fetch work here.
 */

"use client";

import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
} from "@academorix/ui/icons/outline";
import { Button, Chip, EmptyState, Label, SearchField, Tooltip } from "@academorix/ui/react";
import { useCallback, useMemo, useState } from "react";

import type { CompareCell, CompareRow, CompareSection, PlanCta, PlanTierData } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { resolveIcon } from "@/lib/icon-registry";
import { resolveCta } from "@/lib/marketing/cta";

/** Renders a single cell value based on its discriminator. */
function CellValue({ cell }: { cell: CompareCell | undefined }): ReactNode {
  if (!cell || cell.type === "excluded") {
    return <MinusIcon aria-label="Not included" className="mx-auto size-4 text-muted" />;
  }

  if (cell.type === "included") {
    return <CheckIcon aria-label="Included" className="mx-auto size-5 text-foreground" />;
  }

  if (cell.type === "custom") {
    return <span className="text-sm font-medium text-foreground">Custom</span>;
  }

  if (cell.type === "addon") {
    return <span className="text-xs font-medium text-muted">{cell.label ?? "Paid add-on"}</span>;
  }

  return (
    <div className="flex flex-col items-center">
      <span className="text-sm text-foreground">{cell.primary}</span>
      {cell.secondary ? <span className="text-xs text-muted">{cell.secondary}</span> : null}
    </div>
  );
}

/** Renders the label cell (leftmost column) with an optional `i` tooltip icon. */
function RowLabel({ row }: { row: CompareRow }): ReactNode {
  if (!row.info) {
    return <span className="text-sm text-foreground">{row.label}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      {row.label}
      <Tooltip delay={100}>
        <span
          aria-label={`Info about ${row.label}`}
          className="inline-flex size-4 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
          role="button"
          tabIndex={0}
        >
          <InformationCircleIcon aria-hidden="true" className="size-4" />
        </span>
        <Tooltip.Content showArrow className="max-w-xs">
          <Tooltip.Arrow />
          <p className="text-xs">{row.info}</p>
        </Tooltip.Content>
      </Tooltip>
    </span>
  );
}

/** Whether the given row matches the current search filter. */
function rowMatches(row: CompareRow, query: string): boolean {
  if (!query) {
    return true;
  }

  const needle = query.toLowerCase();

  return (
    row.label.toLowerCase().includes(needle) || (row.info?.toLowerCase().includes(needle) ?? false)
  );
}

/** Renders one section (icon + title + description + tables per sub-category). */
function SectionBlock({
  section,
  plans,
  query,
}: {
  section: CompareSection;
  plans: readonly PlanTierData[];
  query: string;
}): ReactNode {
  const Icon = resolveIcon(section.icon);

  const filteredSubcategories = useMemo(() => {
    return section.subcategories
      .map((sub) => ({ ...sub, rows: sub.rows.filter((row) => rowMatches(row, query)) }))
      .filter((sub) => sub.rows.length > 0);
  }, [section.subcategories, query]);

  if (filteredSubcategories.length === 0) {
    return null;
  }

  const sectionId = `compare-section-${section.title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={sectionId} className="border-t border-default">
      <header className="pt-14 pb-2">
        <h3
          className="flex items-center gap-2 text-lg font-semibold text-foreground"
          id={sectionId}
        >
          <Icon aria-hidden="true" className="size-5 text-foreground" />
          {section.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{section.description}</p>
      </header>

      {filteredSubcategories.map((sub, subIndex) => (
        <div key={sub.label || `sub-${subIndex}`} className="pt-6">
          {sub.label ? (
            <h4 className="pb-3 text-sm font-semibold text-foreground">{sub.label}</h4>
          ) : null}
          <div className="divide-y divide-default/60 border-y border-default/60">
            {sub.rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] gap-6 py-3.5"
              >
                <div className="flex items-center">
                  <RowLabel row={row} />
                </div>
                {plans.map((plan) => (
                  <div key={plan.key} className="flex items-center justify-center text-center">
                    <CellValue cell={row.values[plan.key]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      {section.regional_pricing_href ? (
        <div className="mt-6 flex items-center justify-center">
          <Link
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            href={section.regional_pricing_href}
          >
            Regional pricing
            <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}

/** Sticky header row (search + plan names) shown at the top of the matrix. */
function StickyHeader({
  plans,
  query,
  onQueryChange,
}: {
  plans: readonly PlanTierData[];
  query: string;
  onQueryChange: (next: string) => void;
}): ReactNode {
  return (
    <div className="sticky top-16 z-20 -mx-6 border-b border-default bg-background/85 px-6 py-4 backdrop-blur">
      <div className="grid grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] items-center gap-6">
        <SearchField
          aria-label="Search features"
          value={query}
          variant="secondary"
          onChange={onQueryChange}
        >
          <Label className="sr-only">Search features</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search features…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        {plans.map((plan) => (
          <div key={plan.key} className="flex flex-col items-center gap-1 text-center">
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">
              {plan.eyebrow}
            </span>
            {plan.is_popular ? (
              <Chip color="accent" size="sm" variant="soft">
                <Chip.Label>Popular</Chip.Label>
              </Chip>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Per-column CTA row rendered at the bottom of the matrix. */
function MatrixCtas({ plans }: { plans: readonly PlanTierData[] }): ReactNode {
  const openCta = useCallback((cta: PlanCta): void => {
    window.location.href = resolveCta(cta);
  }, []);

  return (
    <div className="grid grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] items-center gap-6 border-t border-default pt-8">
      <div />
      {plans.map((plan) => (
        <div key={plan.key} className="flex justify-center">
          <Button
            className="rounded-full"
            size="sm"
            variant={plan.is_popular ? "primary" : "secondary"}
            onPress={() => openCta(plan.matrix_cta)}
          >
            {plan.matrix_cta.label}
          </Button>
        </div>
      ))}
    </div>
  );
}

/** Props for {@link PricingMatrix}. */
interface PricingMatrixProps {
  plans: readonly PlanTierData[];
  sections: readonly CompareSection[];
}

/** The comparison matrix section. */
export function PricingMatrix({ plans, sections }: PricingMatrixProps): ReactNode {
  const [query, setQuery] = useState("");

  // Count how many rows the current query resolves to across all sections.
  // If zero, we show an EmptyState instead of the section list — otherwise
  // the search field ends up alone above an empty matrix, which reads as
  // a broken state (the exact bug the screenshot flagged).
  const totalMatchingRows = useMemo(() => {
    if (!query) {
      return sections.reduce(
        (total, section) =>
          total + section.subcategories.reduce((sub, s) => sub + s.rows.length, 0),
        0,
      );
    }

    let total = 0;

    for (const section of sections) {
      for (const sub of section.subcategories) {
        for (const row of sub.rows) {
          if (rowMatches(row, query)) {
            total += 1;
          }
        }
      }
    }

    return total;
  }, [sections, query]);

  const hasResults = totalMatchingRows > 0;

  return (
    <section
      aria-labelledby="pricing-compare-heading"
      className="mx-auto w-full max-w-6xl px-6 pb-24"
    >
      <h2
        className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        id="pricing-compare-heading"
      >
        Compare every plan
      </h2>

      <StickyHeader plans={plans} query={query} onQueryChange={setQuery} />

      {hasResults ? (
        <>
          <div className="pb-4">
            {sections.map((section) => (
              <SectionBlock
                key={`${section.icon}-${section.title}`}
                plans={plans}
                query={query}
                section={section}
              />
            ))}
          </div>

          <MatrixCtas plans={plans} />
        </>
      ) : (
        <div className="mt-12 flex justify-center border-t border-default pt-16">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <MagnifyingGlassIcon className="size-6" />
              </EmptyState.Media>
              <EmptyState.Title>No matching features</EmptyState.Title>
              <EmptyState.Description className="max-w-md text-pretty">
                We couldn&apos;t find a feature matching <b>&ldquo;{query}&rdquo;</b>. Try a broader
                term, or clear the search to see the full comparison.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content className="flex-row gap-2">
              <Button size="sm" variant="primary" onPress={() => setQuery("")}>
                Clear search
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setQuery("attendance")}>
                Try &ldquo;attendance&rdquo;
              </Button>
            </EmptyState.Content>
          </EmptyState>
        </div>
      )}
    </section>
  );
}
