/**
 * @file faq-section.tsx
 * @module components/pricing/faq-section
 *
 * @description
 * Vercel-parity FAQ using HeroUI's `Accordion` primitive. Takes hydrated
 * `items` from the Server Component page — no data fetching here.
 */

"use client";

import { ChevronDownIcon } from "@academorix/ui/icons/outline";
import { Accordion } from "@academorix/ui/react";

import type { FaqItem } from "@/lib/types";
import type { ReactNode } from "react";

/** Props for {@link FaqSection}. */
interface FaqSectionProps {
  items: readonly FaqItem[];
}

/** The FAQ section with numbered accordion items. */
export function FaqSection({ items }: FaqSectionProps): ReactNode {
  return (
    <section aria-labelledby="pricing-faq-heading" className="border-t border-default">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-14">
        <div>
          <h2
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            id="pricing-faq-heading"
          >
            Frequently
            <br />
            asked questions.
          </h2>
        </div>

        <Accordion className="w-full">
          {items.map((item, index) => {
            const number = String(index + 1).padStart(2, "0");

            return (
              <Accordion.Item key={item.question} id={`faq-${index}`}>
                <Accordion.Heading>
                  <Accordion.Trigger className="items-start gap-6 py-5 text-left">
                    <span
                      aria-hidden="true"
                      className="w-6 shrink-0 text-xs font-medium text-muted tabular-nums"
                    >
                      {number}
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {item.question}
                    </span>
                    <Accordion.Indicator>
                      <ChevronDownIcon aria-hidden="true" className="size-4 text-muted" />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="pt-1 pr-8 pb-4 pl-12 text-sm leading-relaxed text-muted">
                    {item.answer}
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
