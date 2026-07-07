/**
 * @file feature-bento.tsx
 * @module components/marketing/feature-bento
 *
 * @description
 * Server-safe bento-grid renderer used for products, sports, and
 * enterprise. Each tile is a two-layer composition:
 *
 *   1. **Illustration backdrop** — a per-slug decorative SVG from
 *      `<GlassIllustration />` positioned across the top of the
 *      tile. Faded and overlaid with a subtle gradient wash so the
 *      title copy underneath stays readable.
 *   2. **Content plate** — icon + title + description + "Learn more"
 *      link, anchored to the bottom of the tile.
 *
 * ## Corner flourishes
 *
 * A small `FIG. 0X` label sits in the top-left corner (Raycast-style
 * technical-drawing flourish). A "Coming soon" badge, when present,
 * pins to the top-right. Both are rendered above the illustration.
 *
 * ## Hover behavior
 *
 * On hover the card lifts (`-translate-y-1`), the border tightens,
 * and a glass reflection gradient sweeps across the top of the tile.
 * The illustration itself becomes slightly more opaque so the
 * decorative content feels alive without stealing attention on
 * initial paint.
 *
 * ## Layout
 *
 * - Single-column on mobile, two-column on `sm`, three-column on `lg`.
 * - Bento hero tiles opt into a double-column span on `sm+` via
 *   `span: "double"`.
 * - Coming-soon tiles pick up a muted state (opacity, softer copy).
 */

import clsx from "clsx";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import { GlassIllustration } from "@/components/brand/glass-illustration";
import { resolveLocale } from "@/i18n/routing";
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

/** Two-digit figure code (`FIG. 01`, `FIG. 02`, …). */
function formatFigCode(index: number): string {
  return `FIG. ${String(index + 1).padStart(2, "0")}`;
}

/**
 * Localized "Learn more" cue for each tile's deep link. Uses the
 * request-time locale from `next-intl/server` so both `/en/*` and
 * `/ar/*` render cleanly without every caller having to plumb the
 * string through.
 */
const LEARN_MORE_LABEL = {
  en: "Learn more",
  ar: "اعرف المزيد",
} as const;

/** Bento grid of icon + title + description tiles with deep links. */
export async function FeatureBento({ items, className }: FeatureBentoProps) {
  const rawLocale = await getLocale();
  const locale = resolveLocale(rawLocale);
  const learnMoreLabel = LEARN_MORE_LABEL[locale];

  return (
    <ul className={clsx("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((tile, index) => {
        const Icon = resolveIcon(tile.icon);
        const muted = tile.is_supported === false;
        const isDouble = tile.span === "double";

        return (
          <li key={tile.slug ?? index} className={clsx(isDouble && "sm:col-span-2")}>
            <Link
              className={clsx(
                "group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl",
                "border border-default/40 bg-surface/60 backdrop-blur-md",
                "transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out",
                "hover:-translate-y-1 hover:border-default hover:bg-surface/80 hover:shadow-lg",
                muted && "opacity-80 hover:opacity-100",
              )}
              href={tile.href}
            >
              {/* ── Illustration backdrop ─────────────────────────── */}
              <div
                aria-hidden
                className={clsx(
                  "pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden",
                  "opacity-70 transition-opacity duration-300 group-hover:opacity-100",
                )}
              >
                <GlassIllustration className="h-full w-full text-foreground/60" slug={tile.slug} />
                {/* Gradient wash so the title underneath stays legible */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-surface/95" />
              </div>

              {/* ── Glass reflection on hover ─────────────────────── */}
              <div
                aria-hidden
                className={clsx(
                  "pointer-events-none absolute inset-x-0 top-0 h-24",
                  "bg-gradient-to-b from-foreground/[0.08] via-foreground/[0.03] to-transparent",
                  "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                )}
              />

              {/* ── FIG label (top-start corner) ──────────────────── */}
              <span
                aria-hidden
                className={clsx(
                  "absolute start-4 top-4 z-10 font-mono text-[10px] font-medium tracking-widest",
                  "text-muted uppercase",
                )}
              >
                {formatFigCode(index)}
              </span>

              {/* ── Optional badge (top-end corner) ───────────────── */}
              {tile.badge ? (
                <span
                  className={clsx(
                    "absolute end-4 top-4 z-10 inline-flex items-center rounded-full",
                    "border border-default/60 bg-surface/80 px-2 py-0.5",
                    "text-[10px] font-medium tracking-wider text-muted uppercase",
                    "backdrop-blur-sm",
                  )}
                >
                  {tile.badge}
                </span>
              ) : null}

              {/* ── Content plate (bottom) ────────────────────────── */}
              <div className="relative z-10 mt-auto flex flex-col gap-3 p-6">
                <span
                  className={clsx(
                    "inline-flex size-10 items-center justify-center rounded-xl",
                    "border border-default/40 bg-surface/80 text-foreground shadow-sm backdrop-blur-sm",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{tile.title}</h3>
                  <p className="text-sm text-muted">{tile.description}</p>
                </div>

                <span
                  className={clsx(
                    "mt-2 inline-flex items-center gap-1 text-xs font-medium tracking-wide text-accent",
                    "transition-transform duration-300 group-hover:translate-x-1",
                    "rtl:group-hover:-translate-x-1",
                  )}
                >
                  {learnMoreLabel}
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
