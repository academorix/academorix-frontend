/**
 * @file kpi-band.tsx
 * @module components/marketing/kpi-band
 *
 * @description
 * Grid of prominent KPI tiles used on the landing page and on
 * customer stories. Each tile renders a big number (with optional
 * suffix and locale-aware formatting), a short label, and a
 * one-line caption.
 *
 * `tabular-nums` keeps digits perfectly column-aligned across
 * tiles, which reads as a polished editorial layout instead of an
 * ad-hoc row of statistics.
 */

import clsx from "clsx";
import { getLocale } from "next-intl/server";

import type { Localized } from "@/lib/types";
import type { HomeKpi } from "@/lib/types";

import { LOCALE_BCP47_TAGS } from "@/config/i18n.config";

/** Props for {@link KpiBand}. */
export interface KpiBandProps {
  /** Every KPI to render, already locale-collapsed. */
  items: readonly Localized<HomeKpi>[];
  /** Extra classes for the wrapper. */
  className?: string;
}

/** Format a raw number using the active BCP-47 tag. */
function formatNumber(value: number, locale: string): string {
  const tag = LOCALE_BCP47_TAGS[locale as keyof typeof LOCALE_BCP47_TAGS] ?? locale;

  return new Intl.NumberFormat(tag, {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

/** Renders the four-tile KPI grid used on the landing page. */
export async function KpiBand({ items, className }: KpiBandProps) {
  const locale = await getLocale();

  return (
    <section aria-label="Key numbers" className={clsx("mx-auto max-w-6xl px-6 py-16", className)}>
      <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {items.map((kpi, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-sm"
          >
            <dt className="text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
              {formatNumber(kpi.value, locale)}
              {kpi.suffix ? <span className="text-muted">{kpi.suffix}</span> : null}
            </dt>
            <dd className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{kpi.label}</span>
              <span className="text-xs text-muted">{kpi.caption}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
