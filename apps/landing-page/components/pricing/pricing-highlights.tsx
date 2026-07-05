/**
 * @file pricing-highlights.tsx
 * @module components/pricing/pricing-highlights
 *
 * @description
 * The two spotlight cards on the pricing page. Server Component; consumes
 * hydrated `PricingHighlight[]` from the parent.
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";

import type { PricingHighlight } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

/** Purely decorative illustration for the "Control your spending" card. */
function SpendingChart(): ReactNode {
  const bars = [40, 55, 68, 82, 88, 92];

  return (
    <div className="relative flex h-32 items-end justify-between gap-2">
      {bars.map((height, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex-1 rounded-t-sm bg-foreground/25 transition-colors"
          style={{ height: `${height}%` }}
        />
      ))}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-2 border-t border-dashed border-foreground/40 text-right"
      >
        <span className="inline-block -translate-y-1/2 bg-surface px-2 text-[10px] font-medium tracking-wider text-foreground/60 uppercase">
          Limit
        </span>
      </div>
    </div>
  );
}

/** Purely decorative illustration for the "No idle, no waste" card. */
function GrowthTiles(): ReactNode {
  return (
    <div className="flex h-32 items-end justify-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-foreground/10 text-xs font-semibold text-foreground/70">
        1x
      </div>
      <div className="flex h-24 w-16 items-center justify-center rounded-lg bg-foreground/15 text-xs font-semibold text-foreground/80">
        4x
      </div>
      <div className="flex h-32 w-16 items-center justify-center rounded-lg bg-foreground/20 text-xs font-semibold text-foreground/90">
        16x
      </div>
    </div>
  );
}

/** Renders one spotlight card. */
function HighlightCard({ highlight }: { highlight: PricingHighlight }): ReactNode {
  return (
    <article className="flex h-full flex-col rounded-xl border border-default bg-surface p-6 md:p-8">
      <div className="mb-6 flex-1">
        {highlight.illustration === "spending" ? <SpendingChart /> : <GrowthTiles />}
      </div>
      <Link
        className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
        href={highlight.learn_href}
      >
        Learn about
        <ArrowRightIcon aria-hidden="true" className="size-3" />
      </Link>
      <h3 className="text-xl font-semibold text-foreground sm:text-2xl">{highlight.title}</h3>
      <p className="mt-2 text-sm text-muted">{highlight.description}</p>
    </article>
  );
}

/** Props for {@link PricingHighlights}. */
interface PricingHighlightsProps {
  highlights: readonly PricingHighlight[];
}

/** The two spotlight cards row. */
export function PricingHighlights({ highlights }: PricingHighlightsProps): ReactNode {
  return (
    <section
      aria-labelledby="pricing-highlights-heading"
      className="mx-auto w-full max-w-6xl px-6 pb-16"
    >
      <h2 className="sr-only" id="pricing-highlights-heading">
        Pricing benefits
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {highlights.map((highlight) => (
          <HighlightCard key={highlight.title} highlight={highlight} />
        ))}
      </div>
    </section>
  );
}
