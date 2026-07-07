/**
 * @file quote-block.tsx
 * @module components/marketing/quote-block
 *
 * @description
 * Single-quote pull-out used on product, sport, and customer-story
 * pages. Larger typographic treatment than the testimonials grid so
 * a solitary quote reads as a moment, not a card in a row.
 */

import clsx from "clsx";

import type { Localized } from "@/lib/types";
import type { CustomerQuote } from "@/lib/types";

/** Props for {@link QuoteBlock}. */
export interface QuoteBlockProps {
  quote: Localized<CustomerQuote>;
  className?: string;
}

/** A single quote with attribution. */
export function QuoteBlock({ quote, className }: QuoteBlockProps) {
  return (
    <figure
      className={clsx(
        "mx-auto max-w-3xl rounded-2xl border border-default/40 bg-surface/60 p-8 backdrop-blur-md",
        className,
      )}
    >
      <blockquote className="text-xl leading-relaxed text-balance text-foreground sm:text-2xl">
        &ldquo;{quote.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="grid size-10 place-content-center rounded-full bg-accent/20 text-xs font-semibold tracking-wider text-accent uppercase">
          {quote.initials}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{quote.author}</span>
          <span className="text-xs text-muted">{quote.role}</span>
        </div>
      </figcaption>
    </figure>
  );
}
