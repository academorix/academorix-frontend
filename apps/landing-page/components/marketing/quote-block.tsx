/**
 * @file quote-block.tsx
 * @module components/marketing/quote-block
 *
 * @description
 * Customer testimonial block rendered mid-page on product + sport deep pages.
 * A large blockquote with an initials avatar + attribution below. Server
 * Component — no interactivity needed.
 */

import { Avatar } from "@academorix/ui/react";

import type { CustomerQuote } from "@/lib/types";
import type { ReactNode } from "react";

/** Renders a mid-page customer quote block. */
export function QuoteBlock({ quote }: { quote: CustomerQuote }): ReactNode {
  return (
    <section
      aria-labelledby="quote-block-heading"
      className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20"
    >
      <h2 className="sr-only" id="quote-block-heading">
        What our customers say
      </h2>
      <figure className="flex flex-col gap-6 border-y border-default py-12 md:py-16">
        <blockquote className="text-2xl leading-snug font-medium text-balance text-foreground sm:text-3xl">
          &ldquo;{quote.quote}&rdquo;
        </blockquote>
        <figcaption className="flex items-center gap-4">
          <Avatar color="accent">
            <Avatar.Fallback>{quote.initials}</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{quote.author}</span>
            <span className="text-sm text-muted">{quote.role}</span>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
