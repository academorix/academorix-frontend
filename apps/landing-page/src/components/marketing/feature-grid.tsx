/**
 * @file feature-grid.tsx
 * @module components/marketing/feature-grid
 *
 * @description
 * Icon + title + description grid used by every deep marketing page (product,
 * sport, enterprise). Pure Server Component — resolves the JSON icon key
 * (`"UserGroupIcon"`) into the component at render time.
 */

import type { ProductFeature } from "@/lib/types";
import type { ReactNode } from "react";

import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link FeatureGrid}. */
interface FeatureGridProps {
  /** Section heading (e.g. `"What's included"`). */
  heading?: string;
  /** Optional supporting paragraph under the heading. */
  description?: string;
  /** 5-8 feature tiles. */
  items: readonly ProductFeature[];
}

/** Renders a responsive feature grid on a marketing deep page. */
export function FeatureGrid({ heading, description, items }: FeatureGridProps): ReactNode {
  return (
    <section
      aria-labelledby={heading ? "feature-grid-heading" : undefined}
      className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20"
    >
      {heading ? (
        <div className="mb-12 flex flex-col items-start gap-3">
          <h2
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            id="feature-grid-heading"
          >
            {heading}
          </h2>
          {description ? <p className="max-w-2xl text-base text-muted">{description}</p> : null}
        </div>
      ) : null}

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = resolveIcon(item.icon);

          return (
            <li key={item.title} className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{item.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
