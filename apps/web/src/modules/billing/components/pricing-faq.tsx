/**
 * @file pricing-faq.tsx
 * @module modules/billing/components/pricing-faq
 *
 * @description
 * FAQ section shown at the bottom of the pricing page. Uses HeroUI's
 * `Disclosure` + `DisclosureGroup` for keyboard-navigable, accessible
 * expand/collapse behaviour. Content is static and lives in
 * `pricing-config.ts` so marketing copy can be edited without touching
 * component code.
 */

import { Disclosure, DisclosureGroup } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { PRICING_FAQ } from "@/modules/billing/lib/pricing-config";

/**
 * Renders the pricing-page FAQ as an accordion. Multi-select is enabled so
 * a reader can compare answers side by side.
 */
export function PricingFaq(): ReactNode {
  return (
    <section aria-labelledby="pricing-faq-heading" className="scroll-mt-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">FAQ</p>
          <h2
            className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
            id="pricing-faq-heading"
          >
            Frequently asked questions
          </h2>
        </div>

        <DisclosureGroup allowsMultipleExpanded className="flex flex-col gap-2">
          {PRICING_FAQ.map((item) => (
            <Disclosure
              key={item.id}
              className="rounded-lg border border-default bg-background"
              id={item.id}
            >
              <Disclosure.Heading>
                <Disclosure.Trigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-default/40">
                  <span>{item.question}</span>
                  <Disclosure.Indicator />
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content className="border-t border-default px-4 py-3 text-sm text-muted">
                {item.answer}
              </Disclosure.Content>
            </Disclosure>
          ))}
        </DisclosureGroup>
      </div>
    </section>
  );
}
