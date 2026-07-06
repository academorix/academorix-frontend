/**
 * @file related-links.tsx
 * @module components/marketing/related-links
 *
 * @description
 * Cross-link cards rendered at the bottom of every deep marketing page.
 * Encourages visitors to explore adjacent products / sports / enterprise
 * pages before hitting the footer. Server Component; every link is a plain
 * `next/link` since all destinations are marketing routes.
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";

import type { RelatedLink } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

/** Props for {@link RelatedLinks}. */
interface RelatedLinksProps {
  /** Section heading (defaults to "Continue exploring"). */
  heading?: string;
  items: readonly RelatedLink[];
}

/** Renders the bottom-of-page cross-link cards. */
export function RelatedLinks({
  heading = "Continue exploring",
  items,
}: RelatedLinksProps): ReactNode {
  return (
    <section
      aria-labelledby="related-links-heading"
      className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20"
    >
      <h2
        className="mb-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        id="related-links-heading"
      >
        {heading}
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              className="group flex h-full flex-col justify-between gap-4 rounded-xl border border-default bg-surface p-6 transition-colors hover:border-foreground/20"
              href={item.href}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
                Learn more
                <ArrowRightIcon aria-hidden="true" className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
