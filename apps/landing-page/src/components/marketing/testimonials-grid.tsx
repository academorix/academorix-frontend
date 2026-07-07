/**
 * @file testimonials-grid.tsx
 * @module components/marketing/testimonials-grid
 *
 * @description
 * Three-column testimonial grid used on landing and cross-page
 * rails. Each cell is a quote with attribution (author + role + org
 * + initials avatar) rendered on a glassmorphic card. No stars, no
 * ratings, just the voice of the customer.
 */

import clsx from "clsx";

import type { Localized } from "@/lib/types";
import type { HomeTestimonial } from "@/lib/types";

/** Props for {@link TestimonialsGrid}. */
export interface TestimonialsGridProps {
  items: readonly Localized<HomeTestimonial>[];
  className?: string;
}

/** Three-column grid of enterprise testimonials. */
export function TestimonialsGrid({ items, className }: TestimonialsGridProps) {
  return (
    <ul className={clsx("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>
      {items.map((t, index) => (
        <li
          key={index}
          className="flex h-full flex-col gap-6 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md"
        >
          <blockquote className="text-base leading-relaxed text-foreground">{t.quote}</blockquote>
          <div className="mt-auto flex items-center gap-3">
            <span className="grid size-10 place-content-center rounded-full bg-accent/20 text-xs font-semibold tracking-wider text-accent uppercase">
              {t.initials}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{t.author}</span>
              <span className="text-xs text-muted">
                {t.role}, {t.org}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
