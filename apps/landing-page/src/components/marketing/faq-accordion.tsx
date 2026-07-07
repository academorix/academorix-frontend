/**
 * @file faq-accordion.tsx
 * @module components/marketing/faq-accordion
 *
 * @description
 * Interactive FAQ accordion. Uses the browser-native
 * `<details>` + `<summary>` for zero-JS server rendering, which
 * still gives us expand/collapse without a client hydration cost
 * and stays accessible by default.
 *
 * If any future page needs multi-open toggling or animated open
 * transitions, we can swap to HeroUI's `Accordion` compound API
 * without changing the JSON shape.
 */

import clsx from "clsx";

import type { Localized } from "@/lib/types";
import type { FaqItem } from "@/lib/types";

/** Props for {@link FaqAccordion}. */
export interface FaqAccordionProps {
  items: readonly Localized<FaqItem>[];
  className?: string;
}

/** Zero-JS FAQ accordion built on `<details>`. */
export function FaqAccordion({ items, className }: FaqAccordionProps) {
  return (
    <div
      className={clsx(
        "divide-y divide-default/40 rounded-2xl border border-default/40 bg-surface/60 backdrop-blur-md",
        className,
      )}
    >
      {items.map((item, index) => (
        <details
          key={item.slug ?? index}
          className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-start text-base font-medium text-foreground">
            <span>{item.question}</span>
            <span
              aria-hidden
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-default/60 bg-default/40 text-xs transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
