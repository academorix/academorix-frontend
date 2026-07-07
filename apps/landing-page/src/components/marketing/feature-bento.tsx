/**
 * @file feature-bento.tsx
 * @module components/marketing/feature-bento
 *
 * @description
 * Server-safe bento-grid renderer used for products, sports, and
 * enterprise. Each tile carries an icon, title, description, and
 * anchor href, with optional double-column span for hero tiles.
 * Tiles that are marked "coming soon" render with a muted state and
 * a coming-soon badge.
 *
 * Card visuals lean into the Glass theme: rounded surface with a
 * soft border, backdrop blur on the surface layer, and a hover
 * lift that reads as depth without feeling animated.
 */

import clsx from "clsx";
import Link from "next/link";

import { resolveIcon } from "@/lib/icon-registry";

/** Individual tile shape after locale collapse. */
export interface FeatureBentoTile {
  slug?: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  /** Bento hero tiles span two columns on desktop. */
  span?: "single" | "double";
  /** Badge overlay (e.g. "Coming soon"). */
  badge?: string;
  /** Muted state for coming-soon tiles. */
  is_supported?: boolean;
}

/** Props for {@link FeatureBento}. */
export interface FeatureBentoProps {
  /** Tiles to render. */
  items: readonly FeatureBentoTile[];
  /** Extra classes for the grid wrapper. */
  className?: string;
}

/** Bento grid of icon + title + description tiles with deep links. */
export function FeatureBento({ items, className }: FeatureBentoProps) {
  return (
    <ul className={clsx("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((tile, index) => {
        const Icon = resolveIcon(tile.icon);
        const muted = tile.is_supported === false;

        return (
          <li key={tile.slug ?? index} className={clsx(tile.span === "double" && "sm:col-span-2")}>
            <Link
              className={clsx(
                "group relative flex h-full flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md transition-colors",
                muted
                  ? "opacity-80 hover:bg-default/30 hover:opacity-100"
                  : "hover:border-default hover:bg-surface/80",
              )}
              href={tile.href}
            >
              {tile.badge ? (
                <span className="absolute end-4 top-4 inline-flex items-center rounded-full border border-default/60 bg-surface/80 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted uppercase">
                  {tile.badge}
                </span>
              ) : null}

              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
                <Icon aria-hidden className="size-5" />
              </span>

              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{tile.title}</h3>
                <p className="text-sm text-muted">{tile.description}</p>
              </div>

              <span className="mt-auto pt-2 text-xs font-medium tracking-wide text-accent transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                Learn more →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
