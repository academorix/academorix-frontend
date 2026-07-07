/**
 * @file related-links.tsx
 * @module components/marketing/related-links
 *
 * @description
 * Grid of "you might also like" links rendered at the bottom of
 * every deep page. Cards carry the linked page's title and a
 * one-sentence teaser so visitors can navigate without breaking
 * their reading flow.
 */

import clsx from "clsx";
import Link from "next/link";

import type { Localized } from "@/lib/types";
import type { RelatedLink } from "@/lib/types";

/** Props for {@link RelatedLinks}. */
export interface RelatedLinksProps {
  items: readonly Localized<RelatedLink>[];
  className?: string;
  /** Wrapper heading text. Defaults to "Related". */
  heading?: string;
}

/** Related links grid. */
export function RelatedLinks({ items, className, heading = "Related" }: RelatedLinksProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label={heading} className={clsx("mx-auto max-w-6xl px-6 py-16", className)}>
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">{heading}</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((link, index) => (
          <li key={index}>
            <Link
              className="group flex h-full flex-col gap-2 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md transition-colors hover:border-default hover:bg-surface/80"
              href={link.href}
            >
              <h3 className="text-base font-semibold text-foreground group-hover:text-accent">
                {link.title}
              </h3>
              <p className="text-sm text-muted">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
