/**
 * @file logo-strip.tsx
 * @module components/marketing/logo-strip
 *
 * @description
 * Compact strip of trusted-customer logos. When a real wordmark is
 * shipped for a logo (a real image at `logo_href`), the strip renders
 * it grayscale with a slight tint. Otherwise it falls back to a
 * consistent initials pill so the strip never looks sparse during
 * design review.
 *
 * The eyebrow above the strip and the caption below carry
 * illustrative-until-permission language so we never claim customer
 * endorsement we haven't secured.
 */

import clsx from "clsx";

import type { Localized } from "@/lib/types";
import type { HomeData } from "@/lib/types";

/** Props for {@link LogoStrip}. */
export interface LogoStripProps {
  /** The whole `logos` block from `home.json`, locale-collapsed. */
  data: Localized<HomeData["logos"]>;
  /** Extra classes for the wrapper. */
  className?: string;
}

/** Compact grayscale logo strip. */
export function LogoStrip({ data, className }: LogoStripProps) {
  return (
    <section aria-label="Customers" className={clsx("mx-auto max-w-6xl px-6 py-12", className)}>
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-xs font-medium tracking-wider text-muted uppercase">{data.eyebrow}</p>

        <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {data.items.map((logo, index) => (
            <li
              key={index}
              className="inline-flex items-center gap-2 rounded-full border border-default/40 bg-surface/60 px-4 py-2 backdrop-blur-sm"
            >
              <span className="grid size-8 place-content-center rounded-full bg-default/60 text-xs font-semibold tracking-wider text-foreground uppercase">
                {logo.initials ?? logo.name.substring(0, 2).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-foreground">{logo.name}</span>
            </li>
          ))}
        </ul>

        <p className="max-w-xl text-xs text-muted">{data.caption}</p>
      </div>
    </section>
  );
}
