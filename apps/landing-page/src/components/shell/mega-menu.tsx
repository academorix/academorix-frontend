/**
 * @file mega-menu.tsx
 * @module components/shell/mega-menu
 *
 * @description
 * Interactive mega-menu popover used in the desktop landing header.
 * Wraps a HeroUI-shaped trigger button around a hover/focus-driven
 * `<details>` element, which gives us zero-JS open state plus a
 * lightweight animation surface without pulling in a full popover
 * library.
 *
 * Three layouts are supported so nav.json can drive presentation
 * without any client edits:
 *   - `columns-only`: 2-3 columns of small link groups
 *   - `cards`: a grid of icon-title-description tiles
 *   - `cards-plus-banner`: same as cards, plus a right-column
 *     eyebrow banner CTA
 */

"use client";

import clsx from "clsx";
import Link from "next/link";

import type { Localized, MegaMenuPanel } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link MegaMenu}. */
export interface MegaMenuProps {
  label: string;
  panel: Localized<MegaMenuPanel>;
  className?: string;
}

/** Renders the mega-menu popover for one top-level nav item. */
export function MegaMenu({ label, panel, className }: MegaMenuProps) {
  return (
    <details
      className={clsx("group relative [&_summary::-webkit-details-marker]:hidden", className)}
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-default/40">
        <span>{label}</span>
        <span aria-hidden className="text-xs transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div
        className={clsx(
          "absolute start-0 top-full z-40 mt-2 min-w-[720px] rounded-2xl border border-default/60 bg-surface/95 p-6 shadow-2xl backdrop-blur-md",
          panel.layout === "cards-plus-banner" && "grid grid-cols-3 gap-6",
          panel.layout === "cards" && "grid grid-cols-2 gap-4",
          panel.layout === "columns-only" && "grid grid-cols-3 gap-6",
        )}
      >
        {panel.columns
          ? panel.columns.map((col, i) => (
              <div key={i} className="flex flex-col gap-3">
                <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-1">
                  {col.links.map((link, li) => (
                    <li key={li}>
                      <Link
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-default/40"
                        href={link.href}
                      >
                        <span>{link.label}</span>
                        {link.badge ? (
                          <span className="inline-flex items-center rounded-full border border-default/50 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-muted uppercase">
                            {link.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          : null}

        {panel.feature_cards ? (
          <div
            className={clsx(
              "grid gap-3",
              panel.layout === "cards-plus-banner" ? "col-span-2 grid-cols-2" : "grid-cols-2",
            )}
          >
            {panel.feature_cards.map((card, i) => {
              const Icon = resolveIcon(card.icon);

              return (
                <Link
                  key={i}
                  className="group/card flex flex-col gap-2 rounded-xl border border-default/40 bg-surface/60 p-4 transition-colors hover:border-default hover:bg-default/40"
                  href={card.href}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-default/60 text-foreground">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{card.title}</span>
                    {card.badge ? (
                      <span className="ms-auto inline-flex items-center rounded-full border border-default/50 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-muted uppercase">
                        {card.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">{card.description}</p>
                </Link>
              );
            })}
          </div>
        ) : null}

        {panel.banner ? (
          <Link
            className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/20"
            href={panel.banner.cta_href}
          >
            {(() => {
              const Icon = resolveIcon(panel.banner.icon);

              return (
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent/30 text-accent">
                  <Icon aria-hidden className="size-4" />
                </span>
              );
            })()}
            <span className="text-xs font-semibold tracking-wider text-accent uppercase">
              {panel.banner.eyebrow}
            </span>
            <h4 className="text-base font-semibold text-foreground">{panel.banner.title}</h4>
            <p className="text-xs text-muted">{panel.banner.description}</p>
            <span className="mt-auto text-xs font-medium text-accent">
              {panel.banner.cta_label} →
            </span>
          </Link>
        ) : null}
      </div>
    </details>
  );
}
