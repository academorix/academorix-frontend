/**
 * @file pricing-highlights.tsx
 * @module components/marketing/pricing-highlights
 *
 * @description
 * Two spotlight cards displayed between the pricing tier grid and
 * the full comparison matrix. Each card carries a title, a
 * paragraph, and a "Learn more" link.
 */

import clsx from "clsx";
import Link from "next/link";

import type { Localized, PricingHighlight } from "@/lib/types";

/** Props for {@link PricingHighlights}. */
export interface PricingHighlightsProps {
  items: readonly Localized<PricingHighlight>[];
  className?: string;
}

/** Two-card pricing spotlight row. */
export function PricingHighlights({ items, className }: PricingHighlightsProps) {
  return (
    <ul className={clsx("grid grid-cols-1 gap-4 md:grid-cols-2", className)}>
      {items.map((h, index) => (
        <li key={index}>
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-8 backdrop-blur-md">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{h.title}</h3>
            <p className="text-base leading-relaxed text-muted">{h.description}</p>
            <Link
              className="mt-auto pt-2 text-sm font-medium text-accent transition-transform hover:translate-x-1 rtl:hover:-translate-x-1"
              href={h.learn_href}
            >
              {h.learn_label} →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
