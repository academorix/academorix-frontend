/**
 * @file feature-list.tsx
 * @module components/marketing/feature-list
 *
 * @description
 * Two-column feature grid used on product, sport, enterprise,
 * solution, and persona deep pages. Each entry is an icon tile plus
 * title plus a supporting sentence.
 */

import clsx from "clsx";

import type { Localized } from "@/lib/types";
import type { ProductFeature } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link FeatureList}. */
export interface FeatureListProps {
  items: readonly Localized<ProductFeature>[];
  className?: string;
}

/** Two-column feature grid. */
export function FeatureList({ items, className }: FeatureListProps) {
  return (
    <ul className={clsx("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((feature, index) => {
        const Icon = resolveIcon(feature.icon);

        return (
          <li
            key={index}
            className="flex flex-col gap-3 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
              <Icon aria-hidden className="size-5" />
            </span>
            <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted">{feature.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
