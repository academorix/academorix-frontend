/**
 * @file logo-strip.tsx
 * @module components/landing/logo-strip
 *
 * @description
 * A lightweight trust strip listing partner/customer names. Uses styled text
 * placeholders rather than image assets so the section stays dependency-free
 * and crisp in both themes; swap in real logos when brand art is available.
 */

import type { ReactNode } from "react";

/** Placeholder brand names shown in the trust strip. */
const BRANDS: readonly string[] = [
  "Northgate FC",
  "AquaElite",
  "Summit Hoops",
  "Ace Tennis",
  "Dojo Prime",
  "Vault Gymnastics",
] as const;

/** The social-proof logo/trust strip rendered below the hero. */
export function LogoStrip(): ReactNode {
  return (
    <section aria-labelledby="trust-heading" className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2
          className="text-center text-xs font-medium tracking-wide text-muted uppercase"
          id="trust-heading"
        >
          Powering academies of every size
        </h2>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {BRANDS.map((brand) => (
            <li
              key={brand}
              className="text-lg font-semibold text-muted/70 transition-colors hover:text-foreground"
            >
              {brand}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
